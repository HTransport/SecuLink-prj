import { useEffect, useRef, useState } from "react";
import "./dashboard.css";
import { svg } from "../svg";
import axios from "axios";
import { clearUser } from "../user";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
export default function Dashboard({ tab = 0 }) {
	return (
		<div className="dashboard-container">
			<Nav tab={tab} />
			{tab === 0 ? (
				<Users />
			) : tab === 1 ? (
				<Cards />
			) : tab === 2 ? (
				<Logs />
			) : tab === 3 ? (
				<Readers />
			) : null}
		</div>
	);
}

function Nav({ tab }) {
	const [active, updateActive] = useState({ current: tab, last: tab });
	const [hide, updateHide] = useState(!false);
	const token = useSelector((state) => state.user.value.token);
	const dispatch = useDispatch();
	const data = ["Korisnici", "Kartice", "Aktivnost", "Čitači"];
	const navigate = useNavigate();
	const client = axios.create({
		baseURL: process.env.REACT_APP_API_URL,
	});
	useEffect(() => {
		updateActive((old) => {
			return { ...old, last: old.current };
		});

		navigate(
			active.current === 0
				? "/nadzorna-ploca"
				: active.current === 1
					? "/kartice"
					: active.current === 2
						? "/aktivnost"
						: active.current === 3
							? "/citaci"
							: "/"
		);
	}, [active.current]);
	return (
		<nav className={hide ? "hidden" : ""}>
			<img src="/logo.png" alt="" />
			<ul>
				<span className="slider" style={{ top: `${active.current * 51}px` }}>
					<span
						className="line"
						style={{
							animation:
								active.current === active.last ? "toggle 1s 1 forwards" : "",
						}}
					></span>
				</span>
				{data.map((el, i) => (
					<li
						className={active.current === i ? "active" : ""}
						key={"Nav-element-" + i}
						onClick={() => {
							updateActive((old) => {
								return { ...old, current: i };
							});
						}}
					>
						<a
							href=""
							onClick={(e) => {
								if (!e.ctrlKey) e.preventDefault();
								updateActive(1);
							}}
						>
							{el}
						</a>
					</li>
				))}
				<button
					onClick={() => {
						client.delete("/api/token/" + token).then(() => {
							dispatch(clearUser());
						});
					}}
				>
					Odjava
				</button>
			</ul>
			<span
				className="hide"
				onClick={() => {
					updateHide((old) => !old);
				}}
			>
				{svg.menu}
			</span>
		</nav>
	);
}

function useOuterClick(ref) {
	const [state, updateState] = useState(false);
	useEffect(() => {
		function handleClick(e) {
			updateState(ref.current && !ref.current.contains(e.target));
		}
		document.addEventListener("mousedown", handleClick);
		return () => {
			document.removeEventListener("mousedown", handleClick);
		};
	}, [ref]);

	return state;
}

function Users() {
	const user = useSelector((state) => state.user.value);
	const [dropbox, updateDropbox] = useState({ active: false, selected: -1 });
	const dropboxRef = useRef();
	const [data, updateData] = useState([
	]);
	const dispatch = useDispatch();
	const updateDataInTable = () => {
		client
			.post(`/api/user/${tab === 0 ? "list" : "listnew"}`, {
				numOfElements: 100,
				isNew: true,
				token: user.token,
			})
			.then(({ data }) => data)
			.then((data) => {
				updateData(data);
			})
			.catch((err) => {
				if (err.response?.status === 401) dispatch(clearUser());
			});
	};

	useEffect(() => {
		updateDropbox((old) => {
			return { ...old, active: false };
		});
	}, [useOuterClick(dropboxRef)]);

	useEffect(() => {
		updateDataInTable();
		updateData((old) => old.sort(() => Math.random() - 0.5));
	}, []);
	const [filters, updateFilters] = useState({ sort: 0, search: "" });
	const client = axios.create({
		baseURL: process.env.REACT_APP_API_URL,
	});

	useEffect(() => {
		function localSort(arr, key) {
			return [...arr].sort((el1, el2) =>
				el1[key] > el2[key] ? 1 : el1[key] < el2[key] ? -1 : 0
			);
		}

		switch (dropbox.selected) {
			case 0:
				updateData((old) => localSort(old, "username"));
				break;
			case 1:
				updateData((old) => localSort(old, "firstName"));
				break;
			case 2:
				updateData((old) => localSort(old, "lastName"));
				break;
			case 3:
				updateData((old) => localSort(old, "email"));
				break;

			default:
				break;
		}
	}, [dropbox.selected]);
	const [tab, updateTab] = useState(0);
	const options = ["Korisničko ime", "Ime", "Prezime", "Email"];
	const [userOperation, updateUserOperation] = useState({
		type: "new",
		active: false,
		user: { name: "", lastName: "", email: "", cards: [], role: "" },
	});

	const deleteUser = (valid) => {
		updateDeleteNewUser({ username: "", active: false });
		if (valid)
			client
				.post("/api/user/delete/new", {
					username: deleteNewUser.username,
					token: user.token,
				})
				.then(({ data }) => data)
				.then((res) => {
					updateDataInTable();
					updateDeleteNewUser({ username: "", active: false });
				})
				.catch((err) => {
					if (err.response?.status === 401) dispatch(clearUser());
					updateDeleteNewUser({ username: "", active: false });
				});
	};
	const [deleteNewUser, updateDeleteNewUser] = useState({
		username: "",
		active: false,
	});
	useEffect(() => {
		updateData([]);
		updateDataInTable();
	}, [tab]);
	return (
		<>
			{deleteNewUser.active ? (
				<div className="background-div">
					<div className="confirm">
						<h3>
							Da li ste sigurni da želite obrisati korisnika:
							<br />
							{deleteNewUser.username}
						</h3>
						<div>
							<button
								onClick={() => {
									deleteUser(false);
								}}
							>
								Odustani
							</button>
							<button
								onClick={() => {
									deleteUser(true);
								}}
							>
								Obriši
							</button>
						</div>
					</div>
				</div>
			) : null}
			{userOperation.active ? (
				<UserOperations
					update={userOperation.type === "edit"}
					userData={userOperation.user}
					hide={() => {
						updateUserOperation((old) => {
							return { ...old, active: false };
						});
					}}
					updateTable={updateDataInTable}
				/>
			) : null}
			<main>
				<div className="row">
					<h1>Korisnici</h1>
					<button
						onClick={() => {
							updateUserOperation((old) => {
								return { ...old, type: "new", active: true };
							});
						}}
					>
						Novi korisnik
					</button>
				</div>
				<div className="row toolbox">
					<label htmlFor="search-box" className="custom-input" style={{ opacity: 0, cursor: "default", }} >
						<img src="/search.svg" />
						<input
							type="text"
							id="search-box"
							placeholder="Pretraga po ključnim riječima"
							value={filters.search}
							style={{ cursor: "default", }}
							onChange={(e) => {
								updateFilters((old) => {
									return { ...old, search: e.target.value };
								});
							}}
							autoComplete="off"
						/>
					</label>
					<div className="sort">
						Sortiraj po:
						<div
							ref={dropboxRef}
							className={`custom-dropbox ${dropbox.active ? "active" : ""}`}
						>
							<span
								className="selected"
								onClick={() => {
									updateDropbox((old) => {
										return { ...old, active: true };
									});
								}}
							>
								{dropbox.selected === -1 ? "Odabir" : options[dropbox.selected]}{" "}
								<img src="/arrow.svg" alt="" />
							</span>

							<ul>
								{options.map((el, i) => (
									<li
										key={"dropbox-element-" + el + i}
										onClick={() => {
											updateDropbox((old) => {
												return { ...old, active: false, selected: i };
											});
										}}
									>
										{el}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
				<div className="table-container">
					<div className="tab-users">
						<button
							className={tab === 0 ? "active" : ""}
							onClick={() => {
								updateTab(0);
							}}
						>
							Aktivni
						</button>
						<button
							className={tab === 1 ? "active" : ""}
							onClick={() => {
								updateTab(1);
							}}
						>
							Na čekanju
						</button>
					</div>
					{tab === 0 ? (
						<table>
							<thead>
								<tr>
									<th>Korisničko ime</th>
									<th>Ime</th>
									<th>Prezime</th>
									<th>Email</th>
									<th>Vrsta ovlasti</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{data.map((el, i) => (
									<tr
										key={"table-element-" + i}
										onClick={() => {
											updateUserOperation((old) => {
												return { ...old, type: "edit", user: el, active: true };
											});
										}}
									>
										<td>{el.username}</td>
										<td>{el.firstName}</td>
										<td>{el.lastName}</td>
										<td>{el.email}</td>
										<td>{el.role ? "administrator" : "korisnik"}</td>
										<td
											style={{
												width: "60px",
												fontSize: "30px",
												lineHeight: "25px",
											}}
										>
											<svg width="6" height="20" viewBox="0 0 6 20" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M2.83337 7.50085C1.45837 7.50085 0.333374 8.62585 0.333374 10.0009C0.333374 11.3759 1.45837 12.5009 2.83337 12.5009C4.20837 12.5009 5.33337 11.3759 5.33337 10.0009C5.33337 8.62585 4.20837 7.50085 2.83337 7.50085ZM2.83337 0.000854492C1.45837 0.000854492 0.333374 1.12585 0.333374 2.50085C0.333374 3.87585 1.45837 5.00085 2.83337 5.00085C4.20837 5.00085 5.33337 3.87585 5.33337 2.50085C5.33337 1.12585 4.20837 0.000854492 2.83337 0.000854492ZM2.83337 15.0009C1.45837 15.0009 0.333374 16.1259 0.333374 17.5009C0.333374 18.8759 1.45837 20.0009 2.83337 20.0009C4.20837 20.0009 5.33337 18.8759 5.33337 17.5009C5.33337 16.1259 4.20837 15.0009 2.83337 15.0009Z" fill="white" />
											</svg>
										</td>
									</tr>
								))}
								<tr className="table-end">
									<td colSpan={7}></td>
								</tr>
							</tbody>
						</table>
					) : (
						<table>
							<thead>
								<tr>
									<th>Ime</th>
									<th>Prezime</th>
									<th>Korisničko ime</th>
									<th>Jednokratni pin</th>
									<th>Vrsta ovlasti</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{data.map((el, i) => (
									<tr key={"table-element-" + i} style={{cursor:"default",}}
									>
										<td>{el.firstName}</td>
										<td>{el.lastName}</td>
										<td>{el.username}</td>
										<td>{el.pin}</td>
										<td>{el.role ? "administrator" : "korisnik"}</td>
										<td
											onClick={() => {
												updateDeleteNewUser({
													active: true,
													username: el.username,
												});
											}}
											style={{ color: "red", cursor:"pointer"}}
										>
											Obriši
										</td>
									</tr>
								))}
								<tr className="table-end">
									<td colSpan={6}></td>
								</tr>
							</tbody>
						</table>
					)}
				</div>
			</main>
		</>
	);
}

function Cards() {
	const token = useSelector((state) => state.user.value.token);
	const [data, updateData] = useState([]);
	const dispatch = useDispatch();
	const updateDataInTable = () => {
		client
			.post("/api/card/list", { numOfElements: 100, isNew: true, token })
			.then(({ data }) => data)
			.then((data) => {
				updateData(data);
			})
			.catch((err) => {
				if (err.response?.status === 401) dispatch(clearUser());
			});
	};
	useEffect(() => {
		updateDataInTable();
	}, []);
	const [filters, updateFilters] = useState({ sort: 0, search: "" });
	const client = axios.create({
		baseURL: process.env.REACT_APP_API_URL,
	});

	const [dropbox, updateDropbox] = useState({ active: false, selected: 0 });
	const options = ["Korisničko ime", "Serijski broj"];
	useEffect(() => {
		function localSort(arr, key) {
			return [...arr].sort((el1, el2) =>
				el1[key] > el2[key] ? 1 : el1[key] < el2[key] ? -1 : 0
			);
		}

		switch (dropbox.selected) {
			case 0:
				updateData((old) => localSort(old, "username"));
				break;
			case 1:
				updateData((old) => localSort(old, "serialNumber"));
				break;

			default:
				break;
		}
	}, [dropbox.selected]);
	return (
		<>
			<main>
				<h1>Kartice</h1>
				<div className="row toolbox">
					<label htmlFor="search-box" className="custom-input" style={{ opacity: 0, cursor: "default", }} >
						<img src="/search.svg" />
						<input
							style={{ cursor: "default", }}
							type="text"
							id="search-box"
							placeholder="Pretraga po ključnim riječima"
							value={filters.search}
							onChange={(e) => {
								updateFilters((old) => {
									return { ...old, search: e.target.value };
								});
							}}
							autoComplete="off"
						/>
					</label>
					<div className="sort">
						Sortiraj po:
						<div className={`custom-dropbox ${dropbox.active ? "active" : ""}`}>
							<span
								className="selected"
								onClick={() => {
									updateDropbox((old) => {
										return { ...old, active: true };
									});
								}}
							>
								{options[dropbox.selected]} <img src="/arrow.svg" alt="" />
							</span>

							<ul>
								{options.map((el, i) => (
									<li
										key={"dropbox-element-" + el + i}
										onClick={() => {
											updateDropbox((old) => {
												return { ...old, active: false, selected: i };
											});
										}}
									>
										{el}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
				<div className="table-container">
					<table>
						<thead>
							<tr>
								<th>Serijski broj</th>
								<th>Korisničko ime</th>
							</tr>
						</thead>
						<tbody>
							{data.map((el, i) => (
								<tr key={"table-element-" + i} style={{cursor:"default",}}>
									<td>{el.serialNumber}</td>
									<td>{el.username}</td>
								</tr>
							))}
							<tr className="table-end">
								<td colSpan={7}></td>
							</tr>
						</tbody>
					</table>
				</div>
			</main>
		</>
	);
}

function Logs() {
	const [filter, updateFilter] = useState("");
	const [data, updateData] = useState([]);
	const client = axios.create({
		baseURL: process.env.REACT_APP_API_URL,
	});
	const dispatch = useDispatch();
	const token = useSelector((state) => state.user.value.token);

	const updateDataInTable = () => {
		function localSort(arr, key) {
			return [...arr].sort((el1, el2) =>
				new Date(el1[key]) > new Date(el2[key])
					? -1
					: new Date(el1[key]) < new Date(el2[key])
						? 1
						: 0
			);
		}
		client
			.post("/api/reader/logs", {
				numOfElements: 100,
				isNew: true,
				token,
			})
			.then(({ data }) => data)
			.then((data) => {
				updateData(localSort(data, "doc"));
			})
			.catch((err) => {
				if (err.response?.status === 401) dispatch(clearUser());
			});
	};

	useEffect(() => {
		updateDataInTable();
	}, []);

	return (
		<main>
			<div className="row">
				<h1>Aktivnost</h1>
			</div>
			<div className="row toolbox">
				<label htmlFor="search-box" className="custom-input" style={{ opacity: 0, cursor: "default", }}>
					<img src="/search.svg" />
					<input
						style={{ cursor: "default", }}
						type="text"
						id="search-box"
						placeholder="Pretraga po ključnim riječima"
						value={filter.search}
						onChange={(e) => {
							updateFilter(e.target.value);
						}}
						autoComplete="off"
					/>
				</label>
			</div>
			<div className="table-container">
				<table>
					<thead>
						<tr>
							<th>Vrijeme</th>
							<th>Serijski broj</th>
							<th>MAC</th>
						</tr>
					</thead>
					<tbody>
						{data.map((el, i) => (
							<tr key={"table-element-" + i} style={{cursor:"default",}}>
								<td>
									{new Date(el.doc).toLocaleString("hr-HR", {
										year: "numeric",
										month: "numeric",
										day: "numeric",
										hour: "numeric",
										minute: "numeric",
										second: "numeric",
									})}
								</td>
								<td>{el.serialNumber}</td>
								<td>{el.mac}</td>
							</tr>
						))}
						<tr className="table-end">
							<td colSpan={3}></td>
						</tr>
					</tbody>
				</table>
			</div>
		</main>
	);
}

function ReaderOperations({
	readerData = {},
	hide = () => { },
	updateTable = () => { },
}) {
	const client = axios.create({
		baseURL: process.env.REACT_APP_API_URL,
	});

	const dispatch = useDispatch();
	const token = useSelector((state) => state.user.value.token);

	const setRole = ({role}) => {
		client
			.post("/api/reader/edit", {
				mac: readerData,
				role,
				token,
			})
			.then(({ data }) => data)
			.then((res) => {
				updateTable();
				hide();
			})
			.catch((err) => {
				if (err.response?.status === 401) dispatch(clearUser());
			});
	};

	return (
		<div className="background-div">
			<div className="background-div">
				<div className="confirm">
					<h3>Odaberite vrstu ovlasti potrebnu za ulaz:</h3>
					<div>
						<button
							onClick={() => {
								setRole({ role: false });
							}}
						>
							Korisnik
						</button>
						<button
							onClick={() => {
								setRole({ role: true });
							}}
						>
							Administrator
						</button>

						<button
							onClick={() => {
								hide();
							}}
						>
							Odustani
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function Readers() {
	const [filter, updateFilter] = useState("");
	const [data, updateData] = useState([]);
	const [reader, updateReader] = useState({ active: false, mac: "" });
	const client = axios.create({
		baseURL: process.env.REACT_APP_API_URL,
	});
	const dispatch = useDispatch();
	const token = useSelector((state) => state.user.value.token);

	const updateDataInTable = () => {
		client
			.post("/api/reader/list", {
				numOfElements: 100,
				isNew: true,
				token,
			})
			.then(({ data }) => data)
			.then((data) => {
				updateData(data);
			})
			.catch((err) => {
				if (err.response?.status === 401) dispatch(clearUser());
			});
	};

	useEffect(() => {
		updateDataInTable();
	}, []);

	return (
		<>
			{reader.active ? (
				<ReaderOperations
				readerData={reader.mac}
					updateTable={updateDataInTable}
					hide={() => {
						updateReader((old) => {
							return { ...old, active: false, mac: "" };
						});
					}}
				/>
			) : null}
			<main>
				<div className="row">
					<h1>Čitači</h1>
				</div>
				<div className="row toolbox">
					<label htmlFor="search-box" className="custom-input" style={{ opacity: 0, cursor: "default", }}>
						<img src="/search.svg" />
						<input
							style={{ cursor: "default", }}
							type="text"
							id="search-box"
							placeholder="Pretraga po ključnim riječima"
							value={filter.search}
							onChange={(e) => {
								updateFilter(e.target.value);
							}}
							autoComplete="off"
						/>
					</label>
				</div>
				<div className="table-container">
					<table>
						<thead>
							<tr>
								<th>MAC</th>
								<th>Vrsta ovlasti</th>
							</tr>
						</thead>
						<tbody>
							{data.map((el, i) => (
								<tr
									key={"table-element-" + i}
									onClick={() => {
										updateReader((old) => {
											return { ...old, active: true, mac: el.mac };
										});
									}}
								>
									<td>{el.mac}</td>
									<td>{el.role ? "administrator" : "korisnik"}</td>
								</tr>
							))}
							<tr className="table-end">
								<td colSpan={3}></td>
							</tr>
						</tbody>
					</table>
				</div>
			</main>
		</>
	);
}

function UserOperations({
	update = false,
	userData = {},
	hide = () => { },
	updateTable = () => { },
}) {
	const [confirm, updateConfirm] = useState({
		confirmed: false,
		active: false,
	});
	const [exit, updateExit] = useState(false);
	const [user, updateUser] = useState(
		update
			? userData
			: {
				NUID: "",
				firstName: "",
				lastName: "",
				email: "",
				role: "USER",
			}
	);
	const client = axios.create({
		baseURL: process.env.REACT_APP_API_URL,
	});

	useEffect(() => {
		updateUser((old) => {
			return { ...old, role: old.role ? "ADMIN" : "USER" };
		});
	}, [userData]);

	const dispatch = useDispatch();

	const token = useSelector((state) => state.user.value.token);

	function localize(str = "") {
		str = str.split(" ");
		for (let i = 0; i < str.length; i++) {
			str[i] = str[i].toLowerCase();
			str[i] = str[i]
				.replace(/š/g, "s")
				.replace(/([čć])/g, "c")
				.replace(/ž/g, "z")
				.replace(/đ/g, "d");
		}
		return str.join("");
	}

	const deleteUser = (valid) => {
		updateConfirm((old) => {
			return { ...old, active: false };
		});
		if (valid)
			client
				.post("/api/user/delete", {
					username: userData.username,
					token,
				})
				.then(({ data }) => data)
				.then((res) => {
					updateTable();
					hide();
				})
				.catch((err) => {
					if (err.response?.status === 401) dispatch(clearUser());
				});
	};

	const submitForm = (e) => {
		e.preventDefault();
		client
			.post("/api/user/create/new", {
				username: localize((user.firstName + user.lastName).toLowerCase()),
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				serialNumber: user.serialNumber,
				role: user.role === "ADMIN",
				token,
			})
			.then(({ data }) => data)
			.then((res) => {
				updateTable();
				hide();
			})
			.catch((err) => {
				if (err.response?.status === 401) dispatch(clearUser());
			});
	};

	const submitFormUpdate = (e) => {
		e.preventDefault();
		client
			.post("/api/user/edit", {
				currentUsername: userData.username,
				currentSerialNumber: userData.serialNumber,
				username: localize((user.firstName + user.lastName).toLowerCase()),
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				serialNumber: user.serialNumber,
				role: user.role === "ADMIN",
				token,
			})
			.then(({ data }) => {
				updateTable(data);
				hide();
			})
			.catch((err) => {
				if (err.response?.status === 401) dispatch(clearUser());
			});
	};

	return (
		<div className={`background-div ${exit ? "hide" : ""}`}>
			{confirm.active ? (
				<div className="background-div">
					<div className="confirm">
						<h3>
							Da li ste sigurni da želite obrisati korisnika:
							<br />
							{userData.username}
						</h3>
						<div>
							<button
								onClick={() => {
									deleteUser(false);
								}}
							>
								Odustani
							</button>
							<button
								onClick={() => {
									deleteUser(true);
								}}
							>
								Obriši
							</button>
						</div>
					</div>
				</div>
			) : null}
			<form className="main" onSubmit={update ? submitFormUpdate : submitForm}>
				<span
					className="exit"
					onClick={() => {
						updateExit(true);
						setTimeout(() => {
							hide();
						}, 250);
					}}
				>
					<img src="/close.svg" />
				</span>
				<h1>{update ? "Uređivanje " : "Kreiranje novog "}korisnika</h1>
				<div className="data-holder">
					<h2>Osnovne informacije</h2>
					<div className="row input-holder">
						<div className="input-div">
							<span>Ime:</span>
							<input
								type="text"
								placeholder="Ivan"
								value={user.firstName}
								onChange={(e) => {
									updateUser((old) => {
										return { ...old, firstName: e.target.value };
									});
								}}
							/>
						</div>
						<div className="input-div">
							<span>Prezime:</span>
							<input
								type="text"
								placeholder="Horvat"
								value={user.lastName}
								onChange={(e) => {
									updateUser((old) => {
										return { ...old, lastName: e.target.value };
									});
								}}
							/>
						</div>
					</div>
					<div className="input-div">
						<span>Email:</span>
						<input
							type="email"
							placeholder="ivan.horvat@secu.link"
							value={user.email}
							onChange={(e) => {
								updateUser((old) => {
									return { ...old, email: e.target.value };
								});
							}}
						/>
					</div>
					<div className="role">
						<h2>Vrsta ovlasti</h2>
						<div className="radio-buttons">
							<label htmlFor="radio-user" className="custom-radio">
								<input
									type="radio"
									name="role"
									id="radio-user"
									checked={user.role === "USER"}
									onChange={(e) => {
										updateUser((old) => {
											return { ...old, role: "USER" };
										});
									}}
								/>
								<span>Korisnik</span>
							</label>

							<label htmlFor="radio-user" className="custom-radio">
								<input
									type="radio"
									name="role"
									id="radio-user"
									checked={user.role === "ADMIN"}
									onChange={() => {
										updateUser((old) => {
											return { ...old, role: "ADMIN" };
										});
									}}
								/>
								<span>Administrator</span>
							</label>
						</div>
					</div>
				</div>
				<div className="cards">
					<h2>Podatci o kartici</h2>
					<div className="input-div">
						<span>NUID (serijski broj):</span>
						<input
							type="text"
							placeholder="000-000-000-000"
							value={user.serialNumber}
							onChange={(e) => {
								updateUser((old) => {
									return { ...old, serialNumber: e.target.value };
								});
							}}
						/>
					</div>
				</div>
				<div className="controls">
					{update ? (
						<button
							type="button"
							onClick={() => {
								updateConfirm((old) => {
									return { ...old, active: true, confirmed: false };
								});
							}}
							className="delete"
						>
							Ukloni korisnika
						</button>
					) : null}
					<button type="submit">
						{update ? "Uredi" : "Kreiraj "} korisnika
					</button>
				</div>
			</form>
		</div>
	);
}
