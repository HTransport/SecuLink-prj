import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import Dashboard from "./dashboard/dashboard";
import UserDashboard from "./dashboard/dashboradUser";
import "./base.css";
import AuthPage from "./auth/auth";

import { configureStore } from "@reduxjs/toolkit";
import { Provider, useDispatch, useSelector } from "react-redux";
import userReducer, { clearUser, updateUser } from "./user";
import {
	BrowserRouter as Router,
	Navigate,
	Route,
	Routes,
} from "react-router-dom";
import axios from "axios";

const root = ReactDOM.createRoot(document.getElementById("root"));

const store = configureStore({
	reducer: {
		user: userReducer,
	},
});

root.render(
	<Provider store={store}>
		<Controller/>
	</Provider>
);

function Controller() {
    const token = useSelector((state) => state.user.value.token);
    const role = useSelector((state) => state.user.value.role);
    const [loading, updateLoading] = useState(token !== "");
    const client = axios.create({
        baseURL: process.env.REACT_APP_API_URL,
    });const dispatch = useDispatch();
    useEffect(() => {
        if(token)
        client
            .get("api/user/" + token)
            .then(({ data }) => data)
            .then(({ role }) => {
                dispatch(updateUser({ role: role ? "ADMIN" : "USER", token }));
                updateLoading(false);
            })
            .catch((err) => {
                if (err.response?.status === 401) dispatch(clearUser());
                updateLoading(false);
            });
    }, []);
    if (loading)
        return (
            <Router>
                <Routes></Routes>
            </Router>
        );
    return (
        <Router>
            <Routes>
                {token === "" ? (
                    <>
                        <Route path="/" element={<Navigate to="/prijava" />} />
                        <Route path="/prijava" element={<AuthPage />} />
                        <Route path="*" element={<Navigate to="/prijava" />} />
                    </>
                ) : role === "ADMIN" ? (
                    <>
                        <Route path="/" element={<Navigate to="/nadzorna-ploca" />} />
                        <Route path="/nadzorna-ploca" element={<Dashboard tab={0} />} />
                        <Route path="/kartice" element={<Dashboard tab={1} />} />
                        <Route path="/aktivnost" element={<Dashboard tab={2} />} />
                        <Route path="/citaci" element={<Dashboard tab={3} />} />
                        <Route path="*" element={<Navigate to="/nadzorna-ploca" />} />
                    </>
                ) : (
                    <>
                        <Route path="/pocetna" element={<UserDashboard />} />
                        <Route path="*" element={<Navigate to="/pocetna" />} />
                    </>
                )}
            </Routes>
        </Router>
    );
}
