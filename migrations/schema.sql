-- 削除
DROP TABLE IF EXISTS OAuthProviders;
DROP TABLE IF EXISTS ApiKeys;
DROP TABLE IF EXISTS MonthlyUsage;
DROP TABLE IF EXISTS Providers;
DROP TABLE IF EXISTS Users;

-- Users テーブル
CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON Users(email);

-- OAuthProviders テーブル
CREATE TABLE OAuthProviders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    oauth_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE INDEX idx_oauth_providers_user_id ON OAuthProviders(user_id);
CREATE INDEX idx_oauth_providers_oauth_id ON OAuthProviders(oauth_id);

-- Providers テーブル
CREATE TABLE Providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    api_key TEXT,
    base_url TEXT NOT NULL,
    path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Providers (name, base_url, path) VALUES
    ('OpenAI', 'https://api.openai.com/', 'v1');

-- ApiKeys テーブル
CREATE TABLE ApiKeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    provider_id INTEGER NOT NULL,
    base_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (provider_id) REFERENCES Providers(id)
);

CREATE INDEX idx_apikeys_api_key ON ApiKeys(api_key);
CREATE INDEX idx_apikeys_user_id ON ApiKeys(user_id);
CREATE INDEX idx_apikeys_provider_id ON ApiKeys(provider_id);

-- MonthlyUsage テーブル
CREATE TABLE MonthlyUsage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (api_key_id) REFERENCES ApiKeys(id)
);

CREATE INDEX idx_monthly_usage_api_key_id ON MonthlyUsage(api_key_id);
CREATE INDEX idx_monthly_usage_year_month ON MonthlyUsage(year, month);
