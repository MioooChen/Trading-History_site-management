import React, { useEffect, useState } from "react";
import { Card, Col, Row, Typography, Spin } from "antd";
import TradeHistory from "./TradeHistory";
import OpenPositions from "./OpenPositions";
import Options from "./Options";
import TradeFilter from "./TradeFilter";  // ✅ 导入交易筛选组件

const { Title, Text } = Typography;

const Homepage = () => {
    const [date, setDate] = useState(new Date().toLocaleDateString());
    const [monthlyStats, setMonthlyStats] = useState(null);
    const [yearlyStats, setYearlyStats] = useState(null);
    const [trades, setTrades] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMonthlyStats(data.monthly);
            setYearlyStats(data.yearly);
            setTrades(data.trades);
            setPositions(data.positions);
            setLoading(false);
        };

        return () => ws.close(); // 组件卸载时关闭 WebSocket
    }, []);

    return (
        <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
            <Title level={2} style={{ textAlign: "center" }}>交易主页</Title>
            <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: "20px" }}>
                📅 日期: {date}
            </Text>

           {/* 📌 交易筛选部分 */}
           <TradeFilter />


            {/* 加载动画 */}
            {loading ? (
                <Spin size="large" style={{ display: "flex", justifyContent: "center", margin: "20px 0" }} />
            ) : (
                <Row gutter={[16, 16]} justify="center">
                    {/* 本月交易情况 */}
                    <Col xs={24} sm={12} md={8}>
                        <Card title="📈 本月交易情况" bordered>
                            <Text>📊 总成交单数: {monthlyStats?.total_trades || "..."}</Text><br />
                            <Text>✅ 正确率: {monthlyStats?.accuracy ? `${(monthlyStats.accuracy * 1).toFixed(2)}%` : "..."}</Text><br />
                            <Text>💰 总收益率: {monthlyStats?.total_profit_ratio ? `${(monthlyStats.total_profit_ratio * 100).toFixed(2)}%` : "..."}</Text><br />
                            <Text>⚠️ 最大回撤: {monthlyStats?.max_drawdown || "..."}</Text><br />
                            <Text>❌ 最大连续错误次数: {monthlyStats?.max_consecutive_losses || "..."}</Text>
                        </Card>
                    </Col>

                    {/* 今年交易情况 */}
                    <Col xs={24} sm={12} md={8}>
                        <Card title="📅 今年交易情况" bordered>
                            <Text>📊 总成交单数: {yearlyStats?.total_trades || "..."}</Text><br />
                            <Text>✅ 正确率: {yearlyStats?.accuracy ? `${(yearlyStats.accuracy * 1).toFixed(2)}%` : "..."}</Text><br />
                            <Text>💰 总收益率: {yearlyStats?.total_profit_ratio ? `${(yearlyStats.total_profit_ratio * 100).toFixed(2)}%` : "..."}</Text><br />
                            <Text>⚠️ 最大回撤: {yearlyStats?.max_drawdown || "..."}</Text><br />
                            <Text>❌ 最大连续错误次数: {yearlyStats?.max_consecutive_losses || "..."}</Text>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* 交易记录 & 当前持仓 */}
            <TradeHistory trades={trades} />
            <OpenPositions positions={positions} />
            <Options />
        </div>
    );
};

export default Homepage;
