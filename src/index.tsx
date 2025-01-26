/* @refresh reload */
import { render } from "solid-js/web";
import { Routes } from "@generouted/solid-router";
import "./index.css";

const wrapper = document.getElementById("app");

if (!wrapper) {
  throw new Error("Wrapper div not found");
}

render(Routes, wrapper);
