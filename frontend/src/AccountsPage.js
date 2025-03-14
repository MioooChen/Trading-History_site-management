import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Card, Spin, Typography } from "antd";

const { Title } = Typography;

const AccountsPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setAccounts(data.accounts || []);
            setLoading(false);
        };

        return () => ws.close();
    }, []);

    const columns = [
        {
            title: "账户号",
            dataIndex: "account_number",
            key: "account_number",
            sorter: (a, b) => a.account_number.localeCompare(b.account_number),
            render: (text) => (
                <Button type="link" onClick={() => navigate(`/account/${text}`)}>
                    {text}
                </Button>
            ),
        },
        {
            title: "平台",
            dataIndex: "platform",
            key: "platform",
            filters: [...new Set(accounts.map(acc => acc.platform))].map(platform => ({
                text: platform,
                value: platform,
            })),
            onFilter: (value, record) => record.platform === value,
        },
        {
            title: "账户类型",
            dataIndex: "account_type",
            key: "account_type",
        },
        {
            title: "创建时间",
            dataIndex: "created_at",
            key: "created_at",
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        },
        {
            title: "当前策略",
            dataIndex: "current_strategy",
            key: "current_strategy",
            render: (strategy) => strategy || "无",
        },
        {
            title: "交易标的",
            dataIndex: "trade_symbols",
            key: "trade_symbols",
        },
        {
            title: "初始资本金",
            dataIndex: "initial_capital",
            key: "initial_capital",
            sorter: (a, b) => a.initial_capital - b.initial_capital,
            render: (capital) => capital ? `$${Number(capital).toFixed(2)}` : "$0.00",
        },
    ];

    return (
        <Card style={{ margin: "20px", padding: "20px" }}>
            <Title level={3} style={{ textAlign: "center" }}>📂 账户管理</Title>

            <Button type="primary" onClick={() => navigate("/")} style={{ marginBottom: "20px" }}>
                🔙 返回主页
            </Button>

            {loading ? (
                <Spin size="large" style={{ display: "flex", justifyContent: "center", marginTop: "20px" }} />
            ) : (
                <Table 
                    columns={columns} 
                    dataSource={accounts.map((acc, index) => ({ ...acc, key: index }))} 
                    pagination={{ pageSize: 10 }}
                    bordered
                />
            )}
        </Card>
    );
};

export default AccountsPage;
