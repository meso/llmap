import { Link, Outlet } from "@remix-run/react";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white flex flex-col justify-between">
        <div className="p-4">
          <h2 className="text-2xl font-bold">Admin</h2>
          <nav className="mt-4">
            <ul>
              <li className="mb-2">
                <Link to="/admin/users" className="block p-2 hover:bg-gray-700 rounded">
                  Users
                </Link>
              </li>
              <li>
                <Link to="/admin/providers" className="block p-2 hover:bg-gray-700 rounded">
                  Providers
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="p-4">
          <Link to="/" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 block text-center">
            User Mypage
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}