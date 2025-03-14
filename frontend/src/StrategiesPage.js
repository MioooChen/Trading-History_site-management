import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Card, Spin, Typography, Tag } from "antd";

const { Title } = Typography;

const StrategiesPage = () => {
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setStrategies(data.strategies || []);
            setLoading(false);
        };

        return () => ws.close();
    }, []);

    const columns = [
        {
            title: "策略号",
            dataIndex: "strategy_number",
            key: "strategy_number",
            sorter: (a, b) => a.strategy_number.localeCompare(b.strategy_number),
            render: (text) => (
                <Button type="link" onClick={() => navigate(`/strategy/${text}`)}>
                    {text}
                </Button>
            ),
        },
        {
            title: "策略类型",
            dataIndex: "strategy_type",
            key: "strategy_type",
        },
        {
            title: "策略状态",
            dataIndex: "strategy_status",
            key: "strategy_status",
            filters: [
                { text: "使用中", value: "使用中" },
                { text: "待调整", value: "待调整" },
                { text: "不适用", value: "不适用" },
            ],
            onFilter: (value, record) => record.strategy_status === value,
            render: (status) => {
                let color = "blue"; // 默认蓝色
        
                if (status === "使用中") color = "green";
                else if (status === "待调整") color = "orange";
                else if (status === "不适用") color = "red";
        
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: "交易标的",
            dataIndex: "trade_target",
            key: "trade_target",
        },
        {
            title: "建模周期",
            dataIndex: "modeling_period",
            key: "modeling_period",
        },
        {
            title: "交易次数",
            dataIndex: "trade_count",
            key: "trade_count",
            sorter: (a, b) => a.trade_count - b.trade_count,
        },
        {
            title: "正确率",
            dataIndex: "accuracy",
            key: "accuracy",
            sorter: (a, b) => a.accuracy - b.accuracy,
            render: (accuracy) => (
                <span style={{ color: accuracy >= 50 ? "green" : "red", fontWeight: "bold" }}>
                    {accuracy}%
                </span>
            ),
        },
    ];

    return (
        <Card style={{ margin: "20px", padding: "20px" }}>
            <Title level={3} style={{ textAlign: "center" }}>📊 策略管理</Title>

            <Button type="primary" onClick={() => navigate("/")} style={{ marginBottom: "20px" }}>
                🔙 返回主页
            </Button>

            {loading ? (
                <Spin size="large" style={{ display: "flex", justifyContent: "center", marginTop: "20px" }} />
            ) : (
                <Table 
                    columns={columns} 
                    dataSource={strategies.map((strategy, index) => ({ ...strategy, key: index }))} 
                    pagination={{ pageSize: 10 }}
                    bordered
                />
            )}
        </Card>
    );
};

export default StrategiesPage;
