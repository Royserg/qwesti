/* @refresh reload */
import { Router } from "@solidjs/router";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { lazy } from "solid-js";
import { render } from "solid-js/web";
import "./index.css";

const wrapper = document.getElementById("app");

if (!wrapper) {
	throw new Error("Wrapper div not found");
}

const routes = [
	{
		path: "/",
		component: lazy(() => import("./pages/index.tsx")),
	},
	{
		path: "/about",
		component: lazy(() => import("./pages/about.tsx")),
	},
];

export const queryClient = new QueryClient();
const Root = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<Router>{routes}</Router>
		</QueryClientProvider>
	);
};

render(Root, wrapper);
