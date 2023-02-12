import { createSlice } from "@reduxjs/toolkit";

var token = "";

try {
	if (localStorage.getItem("token")) token = localStorage.getItem("token");
} catch (error) {}

export const user = createSlice({
	name: "user",
	initialState: {
		value: {
			token: token !== "" ? token : "",
			role: "",
		},
	},
	reducers: {
		createUser: (state, action) => {
			state.value = {
				token: action.payload.token,
				role: action.payload.role,
			};
			localStorage.setItem("token", action.payload.token);
		},
		updateUser: (state, action) => {
			state.value = {
				token: action.payload.token,
				role: action.payload.role,
			};
		},

		clearUser: (state, action) => {
			state.value = {
				token: "",
				role: "",
			};
			localStorage.removeItem("token");
		},
	},
});

export const { createUser, clearUser, updateUser } = user.actions;

export default user.reducer;
