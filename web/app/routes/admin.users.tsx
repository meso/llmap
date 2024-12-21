import { useState } from 'react';
import { json, MetaFunction, type LoaderFunctionArgs, type ActionFunction } from '@remix-run/cloudflare';
import { useLoaderData, useSubmit, useNavigation, Form } from '@remix-run/react';
import { Button } from "~/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { PlusCircle, MoreVertical, Copy, Check } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { useToast } from "~/hooks/use-toast";
import { User } from '~/lib/types';
import { addApiKey, toggleApiKey } from '~/lib/database/apiKeys';
import { getProviders } from '~/lib/database/providers';
import { requireAdmin } from '~/lib/authHelper';

export const meta: MetaFunction = () => {
  return [
    { title: "Admin Users - LLMAP" },
    { name: "description", content: "LLMAP: LLM API Proxy" },
  ];
};

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  const userId = await requireAdmin(context, request);
  const { DB } = context.cloudflare.env;
  const users = await getUsers(DB);
  const providers = await getProviders(DB);
  return json({ userId, users , providers });
};

async function getUsers(DB: D1Database) {
  const usersQuery = await DB.prepare(`
    SELECT u.id, u.name, u.email, u.is_admin, uak.id as api_key_id, uak.provider_id, uak.api_key, uak.is_active
    FROM Users as u
    LEFT OUTER JOIN ApiKeys as uak
    ON u.id = uak.user_id
  `).all();

  const userMap = usersQuery.results.reduce((acc, row) => {
    const userId = row.id as number;
    if (!acc[userId]) {
      acc[userId] = {
        id: userId,
        name: row.name as string,
        email: row.email as string,
        is_admin: Boolean(row.is_admin as string),
        api_keys: [],
      };
    }

    if (row.api_key_id) {
      (acc[userId] as User).api_keys.push({
        id: row.api_key_id as number,
        provider_id: row.provider_id as number,
        api_key: row.api_key as string,
        is_active: Boolean(row.is_active as string),
      });
    }
    return acc;
  }, {});

  return Object.values(userMap) as User[];
}

export const action: ActionFunction = async ({ context, request }) => {
  const userId = await requireAdmin(context, request);
  const { DB } = context.cloudflare.env;
  const formData = await request.formData();
  const action = formData.get('_action');

  switch (action) {
    case 'addApiKey':
    await addApiKey(context.cloudflare.env, formData);
      break;
    case 'toggleAdmin':
      await toggleAdmin(DB, formData, userId);
      break;
    case 'toggleApiKey':
      await toggleApiKey(DB, formData);
      break;
    case 'deleteUser':
      await deleteUser(DB, formData);
      break;
    default:
      return json({ success: false });
  }
  return json({ success: true });
};

async function toggleAdmin(DB: D1Database, formData: FormData, adminId: number) {
  const { userId, is_admin } = Object.fromEntries(formData);
  if (userId.toString() === adminId.toString() && is_admin === 'false') {
    return { success: false, message: 'You cannot remove your own admin privileges.' };
  }
  await DB.prepare(`
    UPDATE Users
    SET is_admin = ?
    WHERE id = ?
  `).bind(is_admin === 'true', userId).run();
}

async function deleteUser(DB: D1Database, formData: FormData) {
  const { userId } = Object.fromEntries(formData);
  await DB.prepare(`
    DELETE FROM ApiKeys
    WHERE user_id = ?
  `).bind(userId).run();
  await DB.prepare(`
    DELETE FROM OAuthProviders
    WHERE user_id = ?
  `).bind(userId).run();
  await DB.prepare(`
    DELETE FROM Users
    WHERE id = ?
  `).bind(userId).run();
}

export default function AdminUsers() {
  const { userId, users, providers } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [isAddApiKeyDialogOpen, setIsAddApiKeyDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const { toast } = useToast();

  const handleAddApiKey = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(event.currentTarget, { method: 'post' });
    setIsAddApiKeyDialogOpen(false);
  };

  const copyToClipboard = (text: string, keyId: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKeyId(keyId);
      toast({
        title: "API Key Copied",
        description: "The API key has been copied to your clipboard.",
      });
      setTimeout(() => setCopiedKeyId(null), 2000);
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>API Keys</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="space-y-2">
                  {user.api_keys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center space-x-2">
                      <div className="w-40">
                        <Badge variant="outline" className="font-semibold">
                          {providers.find(p => p.id === apiKey.provider_id)?.name}
                        </Badge>
                      </div>
                      <span className="font-mono w-32">{apiKey.api_key.slice(0, 8)}****</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(apiKey.api_key, apiKey.id)}
                      >
                        {copiedKeyId === apiKey.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Switch
                        name="is_active"
                        checked={apiKey.is_active}
                        onCheckedChange={(checked) => {
                          submit(
                            { _action: 'toggleApiKey', userId: user.id, apiKeyId: apiKey.id, is_active: checked },
                            { method: 'post' }
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className='mt-2'
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setIsAddApiKeyDialogOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add API Key
                </Button>
              </TableCell>
              <TableCell>
                <Switch
                  name="is_admin"
                  checked={user.is_admin}
                  onCheckedChange={(checked) => {
                    submit(
                      { _action: 'toggleAdmin', userId: user.id, is_admin: checked },
                      { method: 'post' }
                    );
                  }}
                  disabled={userId.toString() === user.id.toString()}
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onSelect={() => {
                        submit(
                          { _action: 'deleteUser', userId: user.id },
                          { method: 'post' }
                        );
                      }}
                      disabled={userId.toString() === user.id.toString()}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isAddApiKeyDialogOpen} onOpenChange={setIsAddApiKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New API Key</DialogTitle>
          </DialogHeader>
          <Form method="post" onSubmit={handleAddApiKey} className="space-y-4">
            <input type="hidden" name="_action" value="addApiKey" />
            <input type="hidden" name="userId" value={selectedUserId ?? ''} />
            <div>
              <Label htmlFor="provider_id">Provider</Label>
              <Select name="provider_id" required>
                <SelectTrigger>
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
            <Button type="submit" disabled={navigation.state === 'submitting'}>
              {navigation.state === 'submitting' ? 'Generating...' : 'Generate API Key'}
            </Button>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}