import React, { useEffect, useState } from "react";
import { Table, Typography, Spin, Tag } from "antd";
import axios from "axios";

const { Title } = Typography;

const OpenPositions = () => {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("http://localhost:5000/api/positions")
            .then(res => {
                setPositions(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("❌ 获取持仓数据失败:", err);
                setLoading(false);
            });
    }, []);

    const columns = [
        {
            title: "账户号",
            dataIndex: "account_id",
            key: "account_id",
            sorter: (a, b) => a.account_id.localeCompare(b.account_id),
        },
        {
            title: "开单时间",
            dataIndex: "open_time",
            key: "open_time",
            sorter: (a, b) => new Date(a.open_time) - new Date(b.open_time),
        },
        {
            title: "品种",
            dataIndex: "symbol",
            key: "symbol",
            filters: [...new Set(positions.map(pos => pos.symbol))].map(symbol => ({
                text: symbol,
                value: symbol,
            })),
            onFilter: (value, record) => record.symbol === value,
        },
        {
            title: "方向",
            dataIndex: "direction",
            key: "direction",
            render: direction => (
                <Tag color={direction === "buy" ? "green" : "red"}>
                    {direction === "buy" ? "📈 买入" : "📉 卖出"}
                </Tag>
            ),
        },
        {
            title: "交易量",
            dataIndex: "lot_size",
            key: "lot_size",
            sorter: (a, b) => a.lot_size - b.lot_size,
        },
        {
            title: "价格",
            dataIndex: "open_price",
            key: "open_price",
            render: price => price ? Number(price).toFixed(2) : "0.00",
        },
        {
            title: "浮动盈亏",
            dataIndex: "floating_pnl",
            key: "floating_pnl",
            sorter: (a, b) => a.floating_pnl - b.floating_pnl,
            render: pnl => (
                <span style={{ color: pnl >= 0 ? "green" : "red", fontWeight: "bold" }}>
                    {pnl.toFixed(2)}
                </span>
            ),
        },
    ];

    return (
        <div style={{ marginTop: "20px" }}>
            <Title level={3} style={{ textAlign: "center" }}>📌 当前持仓</Title>

            {loading ? (
                <Spin size="large" style={{ display: "flex", justifyContent: "center", margin: "20px 0" }} />
            ) : (
                <Table 
                    columns={columns} 
                    dataSource={positions.map((pos, index) => ({ ...pos, key: index }))} 
                    pagination={{ pageSize: 10 }}
                    bordered
                />
            )}
        </div>
    );
};

export default OpenPositions;

