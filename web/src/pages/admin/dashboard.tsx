import { Card, Statistic, Tag } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { mockStats } from "@/services/cloud/mock-data";

export default function AdminDashboardPage() {
    const { t } = useTranslation();
    const { cards, byModel, trend, topUsers } = mockStats;

    const maxTrend = Math.max(...trend, 1);
    const maxByModelCalls = Math.max(...byModel.map((m) => m.calls), 1);
    const maxTop = Math.max(...topUsers.map((u) => u.credits), 1);

    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 86400000);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
                {cards.map((c) => {
                    const isFail = c.key === "failRate";
                    const positive = c.delta >= 0;
                    // failRate 视为反向：上涨为负面（红），下跌为正面（绿）? 但按 spec 统一：正绿上箭头/负红下箭头
                    return (
                        <Card key={c.key} size="small">
                            <Statistic
                                title={t(`admin.dashboard.cards.${c.key}`)}
                                value={c.value}
                                suffix={isFail ? "%" : undefined}
                                precision={isFail ? 1 : 0}
                            />
                            <div className={`mt-2 flex items-center gap-1 text-xs ${positive ? "text-green-600" : "text-red-600"}`}>
                                {positive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                <span>
                                    {positive ? "+" : ""}
                                    {c.delta}% {t("admin.dashboard.vsYesterday")}
                                </span>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Card title={t("admin.dashboard.trend")}>
                <div className="flex items-end gap-2 h-[160px]">
                    {trend.map((value, idx) => {
                        const h = Math.round((value / maxTrend) * 120) + 8;
                        return (
                            <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                                <div
                                    title={`${value}`}
                                    className="w-full rounded bg-stone-200 hover:bg-stone-900 dark:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
                                    style={{ height: h }}
                                />
                                <span className="text-xs text-stone-500">{dates[idx]}</span>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card title={t("admin.dashboard.byModel")}>
                    <div className="space-y-3">
                        {byModel.map((m) => {
                            const pct = Math.round((m.calls / maxByModelCalls) * 100);
                            return (
                                <div key={m.name} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-sm">{m.name}</span>
                                        <span className="text-xs text-stone-500">
                                            {m.calls} {t("admin.dashboard.callsUnit")} · {m.credits} {t("admin.dashboard.creditsUnit")}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded bg-stone-100 dark:bg-stone-800">
                                        <div className="h-2 rounded bg-stone-900 dark:bg-stone-100" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <Card title={t("admin.dashboard.topUsers")}>
                    <div className="space-y-3">
                        {topUsers.map((u, idx) => {
                            const rank = idx + 1;
                            const tagColor = rank === 1 ? "gold" : rank === 2 ? "blue" : "default";
                            const pct = Math.round((u.credits / maxTop) * 100);
                            return (
                                <div key={u.name} className="flex items-center gap-3">
                                    <Tag color={tagColor} className="min-w-[28px] text-center">
                                        {rank}
                                    </Tag>
                                    <span className="w-20 truncate text-sm">{u.name}</span>
                                    <div className="h-2 flex-1 rounded bg-stone-100 dark:bg-stone-800">
                                        <div className="h-2 rounded bg-blue-500" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="w-16 text-right text-sm tabular-nums">{u.credits}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}
