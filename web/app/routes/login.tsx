import { MetaFunction } from '@remix-run/cloudflare';
import { useFetcher } from '@remix-run/react';
import { Button } from '~/components/ui/button';

export const meta: MetaFunction = () => {
  return [
    { title: "Login - LLMAP" },
    { name: "description", content: "LLMAP: LLM API Proxy" },
  ];
};

const LoginPage = () => {
  const fetcher = useFetcher();

  const handleLogin = (provider: string) => {
    fetcher.load(`/auth/${provider}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">ログイン</h1>
        <p className="mb-6 text-center">以下のプロバイダーから選んでログインしてください:</p>
        <div className="space-y-4">
          <Button className="w-full" onClick={() => handleLogin('google')}>
            Googleでログイン
          </Button>
          <Button className="w-full" disabled onClick={() => handleLogin('microsoft')}>
            Microsoftでログイン
          </Button>
          <Button className="w-full" disabled onClick={() => handleLogin('github')}>
            GitHubでログイン
          </Button>
          <Button className="w-full" disabled onClick={() => handleLogin('slack')}>
            Slackでログイン
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;