import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../user";
import "./dashboard.css";

export default function UserDashboard() {
	const token = useSelector((state) => state.user.value.token);
	const [password, updatePassword] = useState({
		old: "",
		new: "",
		updated: false,
	});
	const [user, updateUser] = useState({ name: "", card: "" });
	const [error, updateError] = useState(false);

	const client = axios.create({
		baseURL: process.env.REACT_APP_API_URL,
	});

	const dispatch = useDispatch();

	useEffect(() => {
		client
			.get("api/user/" + token)
			.then(({ data }) => data)
			.then(({ firstName, lastName, serialNumber }) => {
				updateUser({ name: `${firstName} ${lastName}`, card: serialNumber });
			})
			.catch((err) => {
				if (err.response?.status === 401) dispatch(clearUser());
			});
	}, []);

	const submitForm = (e) => {
		e.preventDefault();
		client
			.post("api/user/changepass", {
				token,
				newPassword: password.new,
				oldPassword: password.old,
			})
			.then(({ data }) => data)
			.then(() => {
				updatePassword((old) => {
					return { ...old, updated: true };
				});
				setTimeout(() => {
					updatePassword((old) => {
						return { ...old, updated: false };
					});
				}, 2000);
			})
			.catch((err) => {
				if (err.response?.status === 401) dispatch(clearUser());
				else if (err.response?.status === 403) updateError(true);
			});
	};

	return (
		<div className="dashboard-container role-user">
			<main>
				<div className="main-container">
					<nav>
						<button
							onClick={() => {
								client.delete("/api/token/" + token).then(() => {
									dispatch(clearUser());
								});
							}}
						>
							Odjava
						</button>
					</nav>
					<h1>{user.name}</h1>
					<h5>Vaša kartica je {user.card}.</h5>
					<h2>Promjena zaporke</h2>
					<form className="main" onSubmit={submitForm}>
						<div className="data-holder">
							<div className="input-div">
								<span>Trenutna zaporka:</span>
								<input
									type="password"
									placeholder="*****"
									value={password.old}
									onChange={(e) => {
										updateError(false);
										updatePassword((old) => {
											return { ...old, old: e.target.value };
										});
									}}
								/>
							</div>

							<div className="input-div">
								<span>Nova zaporka:</span>
								<input
									type="password"
									placeholder="*****"
									value={password.new}
									onChange={(e) => {
										updatePassword((old) => {
											return { ...old, new: e.target.value };
										});
									}}
								/>
							</div>
							{error ? (
								<p className="error">Unesena zaporka nije ispravna.</p>
							) : null}
							{password.updated ? (
								<p className="error" style={{ color: "#03d0e9" }}>
									Zaporka promijenjena.
								</p>
							) : null}
							<button type="submit">Promijeni zaporku</button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}
