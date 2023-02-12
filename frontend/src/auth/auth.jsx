import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { svg } from "../svg";
import { clearUser, createUser, updateUser } from "../user";
import "./auth.css";

export default function AuthPage() {
	const [user, updateUser] = useState({
		username: "",
		pass: "",
		error: false,
		pin: "",
	});
	const [login, updateLogin] = useState(true);
	const dispatch = useDispatch();
	const [pending, updatePending] = useState(false);
	const client = axios.create({
		baseURL: process.env.REACT_APP_API_URL,
	});

	const submitForm = (e) => {
		e.preventDefault();
		updatePending(true);
		if (user.pass === "" || user.username === "") {
			updateUser((old) => {
				return { ...old, error: true };
			});
			updatePending(false);
			return;
		}
		client
			.post("/api/user/login", {
				username: user.username,
				password: user.pass,
			})
			.then(({ data }) => data)
			.then(({ role, token }) => {
				dispatch(createUser({ token, role: role ? "ADMIN" : "USER" }));
				updatePending(false);
			})
			.catch((err) => {
				if (err.response?.status === 403 || err.response?.status === 404)
                    updateUser((old) => {
                        return { ...old, error: true };
                    });
				updatePending(false);
			});
	};

	const submitFormReg = (e) => {
		e.preventDefault();
		updatePending(true);
		if (user.pass === "" || user.username === "") {
			updateUser((old) => {
				return { ...old, error: true };
			});
			updatePending(false);
			return;
		}
		client
			.post("/api/user/create", {
				username: user.username,
				password: user.pass,
				pin: user.pin,
			})
			.then(({ data }) => data)
			.then(({ role, token }) => {
				dispatch(createUser({ token, role: role ? "ADMIN" : "USER" }));
				updatePending(false);
			})
			.catch(() => {
				updateUser((old) => {
					return { ...old, error: true };
				});
				updatePending(false);
			});
	};
	return (
		<main className="auth">
			<form
				className="main-div"
				onSubmit={login ? submitForm : submitFormReg}
				autoComplete="off"
			>
				<h1> {login ? "Prijava" : "Registracija"}</h1>
				<div className="container">
					<h2>Korisničko ime: </h2>
					<label htmlFor="input-box" className="custom-input">
						{svg.user}
						<input
							type="text"
							id="input-box"
							name="username"
							placeholder="ivanhorvat"
							value={user.username}
							onChange={(e) => {
								updateUser((old) => {
									return { ...old, username: e.target.value, error: false };
								});
							}}
						/>
					</label>
				</div>
				<div className={`container ${login ? "" : "active"}`} id="pin-input">
					<h2>Pin: </h2>
					<label htmlFor="pin-input-box" className="custom-input">
						{svg.user}
						<input
							type="text"
							id="pin-input-box"
							name="pin"
							placeholder="56461"
							value={user.pin}
							disabled={login}
							onChange={(e) => {
								updateUser((old) => {
									return { ...old, pin: e.target.value, error: false };
								});
							}}
						/>
					</label>
				</div>
				<div className="container">
					<h2>Zaporka: </h2>
					<label htmlFor="input-box-1" className="custom-input">
						{svg.lock}
						<input
							type="password"
							id="input-box-1"
							name="password"
							placeholder="*****"
							value={user.pass}
							onChange={(e) => {
								updateUser((old) => {
									return { ...old, pass: e.target.value, error: false };
								});
							}}
						/>
					</label>
				</div>{" "}
				{user.error ? (
					<p className="error">Provjerite ispravnost unesenih podataka</p>
				) : null}
				<button
					type="submit"
					className={`${pending ? "disabled" : ""} ${
						user.error ? "error-button" : ""
					}`}
				>
					{login ? "Prijavi" : "Registriraj"} se
				</button>
				<p className="info">
					{!login ? "Postojeći korisnik?" : "Novi korisnik?"}{" "}
					<b
						onClick={() => {
							updateLogin((old) => !old);
						}}
					>
						{!login ? "Prijava" : "Registracija"}
					</b>
				</p>
			</form>
		</main>
	);
}
