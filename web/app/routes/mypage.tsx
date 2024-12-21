import { useState } from 'react';
import { json, MetaFunction, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData, useSubmit, Form, Link } from '@remix-run/react';
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Copy, Check, ArrowBigDown, ArrowBigUp } from 'lucide-react';
import { useToast } from "~/hooks/use-toast";
import { addApiKey, toggleApiKey } from '~/lib/database/apiKeys';
import { getProviders } from '~/lib/database/providers';
import { ApiKeyDetail } from '~/lib/types';
import { requireUser } from '~/lib/authHelper';

export const meta: MetaFunction = () => {
  return [
    { title: "API Keys - LLMAP" },
    { name: "description", content: "LLMAP: LLM API Proxy" },
  ];
};

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const { DB } = context.cloudflare.env;
  const { userId, isAdmin } = await requireUser(context, request);

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const apiKeysQuery = await DB.prepare(`
    SELECT ak.id, ak.name, p.name as provider, ak.base_url, ak.api_key, ak.created_at, ak.is_active, 
      (SELECT SUM(input_tokens) FROM MonthlyUsage WHERE api_key_id = ak.id AND year = ? AND month = ?) as usage_in,
      (SELECT SUM(output_tokens) FROM MonthlyUsage WHERE api_key_id = ak.id AND year = ? AND month = ?) as usage_out
    FROM ApiKeys ak
    JOIN Providers p ON ak.provider_id = p.id
    WHERE ak.user_id = ?
  `).bind(year, month, year, month, userId).all<ApiKeyDetail>();

  const apiKeys: ApiKeyDetail[] = apiKeysQuery.results
  const providers = await getProviders(DB, true);
  return json({ userId, apiKeys, providers, isAdmin });
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const { DB } = context.cloudflare.env;
  const { userId } = await requireUser(context, request);
  const formData = await request.formData();
  if (formData.get('userId')?.toString() !== userId.toString()) {
    throw new Error('ユーザーIDが一致しません');
  }
  const action = formData.get('_action');

  switch (action) {
    case 'create':
      await addApiKey(context.cloudflare.env, formData);
      break;
    case 'toggle':
      await toggleApiKey(DB, formData);
      break;
    default:
      return json({ success: false });
  }
  return json({ success: true });
};

export default function ApiKeys() {
  const { userId, apiKeys, providers, isAdmin } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id + message);
      toast({
        title: "Copied to clipboard",
        description: `The ${message} has been copied to your clipboard.`,
      });
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const maskKey = (key: string) => `${key.slice(0, 4)}****`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  return (
    <div className="flex">
      <aside className="w-64 min-h-screen bg-gray-800 text-white flex flex-col justify-between">
        <div className="p-4">
          <h2 className="text-2xl font-bold">LLMAP</h2>
          <nav className="mt-4">
            <ul>
              <li className="mb-2">
                <Link to="/mypage" className="block p-2 hover:bg-gray-700 rounded">
                  API Keys
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        {isAdmin && (
          <div className="p-4">
            <Link to="/admin" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 block text-center">
              Admin Page
            </Link>
          </div>
        )}
      </aside>
      <main className="flex-1 container mx-auto py-10">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API keys here. You can create new keys, activate/deactivate existing keys, or delete them.</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create New API Key</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>Enter details for your new API key.</DialogDescription>
                </DialogHeader>
                <Form method="post" onSubmit={() => setIsCreateDialogOpen(false)}>
                  <input type="hidden" name="_action" value="create" />
                  <input type="hidden" name="userId" value={userId} />
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="provider" className="text-right">
                        Provider
                      </Label>
                      <Select name="provider_id">
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Monthly Usage</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[100px]">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell>{apiKey.name}</TableCell>
                    <TableCell>{apiKey.provider}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{apiKey.base_url}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(apiKey.base_url, apiKey.id, "Base URL")}
                        >
                          {copiedId === apiKey.id + "Base URL" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{maskKey(apiKey.api_key)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(apiKey.api_key, apiKey.id, "API Key")}
                        >
                          {copiedId === apiKey.id + "API Key" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                        {apiKey.usage_in + apiKey.usage_out > 0 ? (
                          <>
                            <div className="flex items-center space-x-2">
                              <ArrowBigUp size={16} /> {apiKey.usage_in.toLocaleString("ja-JP")} tokens
                            </div>
                            <div className="flex items-center space-x-2">
                              <ArrowBigDown size={16} /> {apiKey.usage_out.toLocaleString("ja-JP")} tokens
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                    </TableCell>
                    <TableCell>{formatDate(apiKey.created_at)}</TableCell>
                    <TableCell>
                      <Switch
                        name="is_active"
                        checked={apiKey.is_active}
                        onCheckedChange={(checked) => {
                          submit(
                            { _action: 'toggle', userId: userId, apiKeyId: apiKey.id, is_active: checked },
                            { method: 'post' }
                          );
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}