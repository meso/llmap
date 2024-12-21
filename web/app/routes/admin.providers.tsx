import { useState } from "react";
import { json, MetaFunction, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, useSubmit, useNavigation, Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Provider } from "~/lib/types";
import { requireAdmin } from "~/lib/authHelper";

export const meta: MetaFunction = () => {
  return [
    { title: "Admin Providers - LLMAP" },
    { name: "description", content: "LLMAP: LLM API Proxy" },
  ];
};

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  await requireAdmin(context, request);
  const { DB } = context.cloudflare.env;

  const providersQuery = await DB.prepare(`
    SELECT id, name, api_key, base_url, path, is_active
    FROM Providers
  `).all<Provider>();

  const providers: Provider[] = providersQuery.results.map((provider) => ({
    ...provider,
    is_active: Boolean(provider.is_active),
  }));

  return json({ providers });
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  await requireAdmin(context, request);
  const { DB } = context.cloudflare.env;
  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "create":
      await createProvider(DB, formData);
      break;
    case "update":
      await updateProvider(DB, formData);
      break;
    case "toggle":
      await toggleProvider(DB, formData);
      break;
    case "delete":
      await deleteProvider(DB, formData);
      break;
    default:
      return json({ success: false });
  }
  return json({ success: true });
};

async function createProvider(DB: D1Database, formData: FormData) {
  const { name, api_key, base_url, path } = Object.fromEntries(formData);
  await DB.prepare(`
    INSERT INTO Providers (name, api_key, base_url, path)
    VALUES (?, ?, ?)
  `).bind(name, api_key, base_url, path).run();
}

async function updateProvider(DB: D1Database, formData: FormData) {
  const { id, name, api_key, base_url, path } = Object.fromEntries(formData);
  await DB.prepare(`
    UPDATE Providers
    SET name = ?, api_key = ?, base_url = ?, path = ?
    WHERE id = ?
  `).bind(name, api_key, base_url, path, id).run();
}

async function toggleProvider(DB: D1Database, formData: FormData) {
  const { id, is_active } = Object.fromEntries(formData);
  await DB.prepare(`
    UPDATE Providers
    SET is_active = ?
    WHERE id = ?
  `).bind(is_active === "true", id).run();
}

async function deleteProvider(DB: D1Database, formData: FormData) {
  const { id } = Object.fromEntries(formData);
  await DB.prepare(`
    DELETE FROM Providers
    WHERE id = ?
  `).bind(id).run();
}

export default function AdminProviders() {
  const { providers } = useLoaderData<{ providers: Provider[] }>();
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const submit = useSubmit();
  const navigation = useNavigation();

  const handleToggle = (provider: Provider) => {
    const formData = new FormData();
    formData.append("_action", "toggle");
    formData.append("id", provider.id.toString());
    formData.append("is_active", (!provider.is_active).toString());
    submit(formData, { method: "post" });
  };

  const openModal = (provider: Provider | null = null) => {
    setEditingProvider(provider);
    setIsModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("_action", editingProvider ? "update" : "create");
    submit(formData, { method: "post" });
    setIsModalOpen(false); // ダイアログを閉じる
  };

  const handleDelete = (provider: Provider) => {
    if (confirm(`Are you sure you want to delete ${provider.name}?`)) {
      const formData = new FormData();
      formData.append("_action", "delete");
      formData.append("id", provider.id.toString());
      submit(formData, { method: "post" });
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">LLM API Providers</h1>
        <Button onClick={() => openModal()}>New Provider</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Base URL</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider: Provider) => (
            <TableRow key={provider.id}>
              <TableCell>{provider.name}</TableCell>
              <TableCell>{provider.api_key?.slice(0, 4)}****</TableCell>
              <TableCell>{provider.base_url}</TableCell>
              <TableCell>{provider.path}</TableCell>
              <TableCell>
                <Switch
                  checked={provider.is_active}
                  onCheckedChange={() => handleToggle(provider)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button onClick={() => openModal(provider)}>Edit</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDelete(provider)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) setEditingProvider(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProvider ? "Edit Provider" : "Add New Provider"}</DialogTitle>
          </DialogHeader>
          <Form method="post" onSubmit={handleSubmit} className="space-y-4">
            {editingProvider && <input type="hidden" name="id" value={editingProvider.id} />}
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingProvider?.name}
                required
              />
            </div>
            <div>
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                name="api_key"
                defaultValue={editingProvider?.api_key}
                required
              />
            </div>
            <div>
              <Label htmlFor="base_url">Base URL</Label>
              <Input
                id="base_url"
                name="base_url"
                defaultValue={editingProvider?.base_url}
                required
              />
            </div>
            <div>
              <Label htmlFor="path">Path</Label>
              <Input
                id="path"
                name="path"
                defaultValue={editingProvider?.path}
              />
            </div>
            <Button type="submit" disabled={navigation.state === "submitting"}>
              {navigation.state === "submitting"
                ? "Saving..."
                : editingProvider
                ? "Update Provider"
                : "Add Provider"}
            </Button>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}