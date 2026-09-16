export type MockUser = {
    id: string;
    email: string;
    name: string;
    role: "user" | "admin";
    credits: number;
    vipUntil: string | null;
    status: "active" | "banned";
    calls30d: number;
    lastActiveAt: string;
    createdAt: string;
};

export type MockLedgerEntry = {
    id: string;
    at: string;
    type: "grant" | "consume" | "redeem" | "refund";
    delta: number;
    balance: number;
    reason: string;
};

export type MockRedeemCode = {
    code: string;
    credits: number;
    maxUses: number;
    usedCount: number;
    expiresAt: string;
    createdBy: string;
    status: "active" | "usedUp" | "expired";
};

export type MockChannel = {
    id: string;
    name: string;
    baseUrl: string;
    apiKeyMasked: string;
    enabled: boolean;
    calls30d: number;
    cost30d: number;
    models: Array<{ model: string; unit: "token" | "image" | "second"; price: number }>;
};

export const mockUsers: MockUser[] = [
    {
        id: "u-001",
        email: "admin@canvas.local",
        name: "admin",
        role: "admin",
        credits: 12800,
        vipUntil: "2027-06-01T00:00:00.000Z",
        status: "active",
        calls30d: 3421,
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        createdAt: "2024-03-12T08:00:00.000Z",
    },
    {
        id: "u-002",
        email: "alice@example.com",
        name: "alice",
        role: "user",
        credits: 3200,
        vipUntil: "2026-12-31T00:00:00.000Z",
        status: "active",
        calls30d: 892,
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        createdAt: "2024-06-18T10:30:00.000Z",
    },
    {
        id: "u-003",
        email: "bob@example.com",
        name: "bob",
        role: "user",
        credits: 150,
        vipUntil: null,
        status: "banned",
        calls30d: 12,
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        createdAt: "2024-09-01T09:00:00.000Z",
    },
    {
        id: "u-004",
        email: "carol@example.com",
        name: "carol",
        role: "user",
        credits: 5400,
        vipUntil: "2026-09-30T00:00:00.000Z",
        status: "active",
        calls30d: 1245,
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        createdAt: "2024-10-11T14:20:00.000Z",
    },
    {
        id: "u-005",
        email: "dave@example.com",
        name: "dave",
        role: "user",
        credits: 0,
        vipUntil: null,
        status: "active",
        calls30d: 0,
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        createdAt: "2025-01-02T11:11:00.000Z",
    },
    {
        id: "u-006",
        email: "erin@example.com",
        name: "erin",
        role: "user",
        credits: 860,
        vipUntil: null,
        status: "active",
        calls30d: 231,
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        createdAt: "2025-02-14T09:40:00.000Z",
    },
    {
        id: "u-007",
        email: "frank@example.com",
        name: "frank",
        role: "user",
        credits: 4300,
        vipUntil: "2026-11-15T00:00:00.000Z",
        status: "active",
        calls30d: 987,
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        createdAt: "2024-11-22T16:00:00.000Z",
    },
    {
        id: "u-008",
        email: "grace@example.com",
        name: "grace",
        role: "user",
        credits: 2100,
        vipUntil: null,
        status: "active",
        calls30d: 445,
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        createdAt: "2024-12-05T07:55:00.000Z",
    },
];

export const mockLedger: MockLedgerEntry[] = [
    { id: "l-001", at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), type: "grant", delta: 1000, balance: 4200, reason: "新用户赠送" },
    { id: "l-002", at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), type: "consume", delta: -120, balance: 4080, reason: "生图 gpt-image-1" },
    { id: "l-003", at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), type: "consume", delta: -320, balance: 3760, reason: "视频 veo-3" },
    { id: "l-004", at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), type: "redeem", delta: 500, balance: 4260, reason: "兑换码 IC-AB12-CD34" },
    { id: "l-005", at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), type: "refund", delta: 80, balance: 4340, reason: "失败退款" },
    { id: "l-006", at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), type: "consume", delta: -60, balance: 4280, reason: "文本 gpt-4o-mini" },
];

export const mockRedeemCodes: MockRedeemCode[] = [
    { code: "IC-8F3A-9K2C", credits: 500, maxUses: 10, usedCount: 2, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(), createdBy: "admin", status: "active" },
    { code: "IC-2B7D-4M8P", credits: 1000, maxUses: 1, usedCount: 1, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), createdBy: "admin", status: "usedUp" },
    { code: "IC-5Q9W-3X6Z", credits: 200, maxUses: 5, usedCount: 0, expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), createdBy: "admin", status: "expired" },
    { code: "IC-7Y2V-6N4A", credits: 800, maxUses: 3, usedCount: 1, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), createdBy: "admin", status: "active" },
    { code: "IC-9C4E-2H7J", credits: 300, maxUses: 20, usedCount: 5, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(), createdBy: "admin", status: "active" },
];

export const mockChannels: MockChannel[] = [
    {
        id: "ch-001",
        name: "Atlas 主渠道",
        baseUrl: "https://api.atlas.example.com",
        apiKeyMasked: "sk-atlas-****-7f2c",
        enabled: true,
        calls30d: 4210,
        cost30d: 18200,
        models: [
            { model: "gpt-image-1", unit: "image", price: 12 },
            { model: "gpt-4o-mini", unit: "token", price: 0.6 },
        ],
    },
    {
        id: "ch-002",
        name: "Nebula 备用",
        baseUrl: "https://api.nebula.example.com",
        apiKeyMasked: "sk-nebula-****-a3d9",
        enabled: false,
        calls30d: 0,
        cost30d: 0,
        models: [{ model: "veo-3", unit: "second", price: 18 }],
    },
    {
        id: "ch-003",
        name: "Orion 影像",
        baseUrl: "https://api.orion.example.com",
        apiKeyMasked: "sk-orion-****-c9e1",
        enabled: true,
        calls30d: 980,
        cost30d: 5400,
        models: [
            { model: "sora-2", unit: "second", price: 22 },
            { model: "flux-pro", unit: "image", price: 8 },
        ],
    },
];

export const mockStats = {
    cards: [
        { key: "dau" as const, value: 1248, delta: 6.2 },
        { key: "calls" as const, value: 5320, delta: -2.4 },
        { key: "credits" as const, value: 42800, delta: 8.1 },
        { key: "failRate" as const, value: 1.2, delta: -0.3 },
    ],
    byModel: [
        { name: "gpt-image-1", calls: 1820, credits: 14800 },
        { name: "veo-3", calls: 860, credits: 9200 },
        { name: "gpt-4o-mini", calls: 2640, credits: 18800 },
    ],
    trend: [420, 580, 510, 620, 780, 690, 820],
    topUsers: [
        { name: "alice", credits: 4200 },
        { name: "carol", credits: 3100 },
        { name: "frank", credits: 2800 },
        { name: "grace", credits: 1500 },
        { name: "erin", credits: 900 },
    ],
};
