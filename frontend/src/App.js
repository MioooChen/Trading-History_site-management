import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./Homepage";
import AccountsPage from "./AccountsPage";
import StrategiesPage from "./StrategiesPage";
import AccountDetail from "./AccountDetail";
import StrategyDetail from "./StrategyDetail";



const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/strategies" element={<StrategiesPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/account/:accountNumber" element={<AccountDetail />} />
                <Route path="/strategy/:strategyNumber" element={<StrategyDetail />} />
            </Routes>
        </Router>
    );
};

export default App;