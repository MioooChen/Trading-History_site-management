import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Typography, Spin } from "antd";

const { Title, Text } = Typography;
const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8080";

const Options = () => {
    const [accountCount, setAccountCount] = useState(null);
    const [strategyCount, setStrategyCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); 

    useEffect(() => {
        const ws = new WebSocket(WS_URL);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setAccountCount(data.account_count);
            setStrategyCount(data.strategy_count);
            setLoading(false);
        };

        return () => ws.close();
    }, []);

    return (
        <Card style={{ marginTop: "120px", padding: "40px", textAlign: "center", marginBottom: "200px", minWidth: "900px" }}>
            <Title level={3}>⚙️ 选项</Title>

            {loading ? (
                <Spin size="large" style={{ display: "block", margin: "20px auto" }} />
            ) : (
                <>
                    <Text strong>账户管理:</Text> <Text type="success">{accountCount} 个</Text>
                    <br />
                    <Button 
                        type="default" 
                        size="large" 
                        onClick={() => navigate("/accounts")} 
                        style={{ marginTop: "10px", width: "200px" }}
                    >
                        📂 账户管理
                    </Button>

                    <br /><br />

                    <Text strong>策略管理:</Text> <Text type="warning">{strategyCount} 个</Text>
                    <br />
                    <Button 
                        type="default" 
                        size="large" 
                        onClick={() => navigate("/strategies")} 
                        style={{ marginTop: "10px", width: "200px" }}
                    >
                        📊 策略管理
                    </Button>
                </>
            )}
        </Card>
    );
};

export default Options;
