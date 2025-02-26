import { A } from "@solidjs/router";
import { Component } from "solid-js"
import { BaseLayout } from "~/layouts/base";

const QuestDetails: Component = () => {
  return (
    <BaseLayout>
      <h2>Quest header</h2>
      <div>Some content</div>

      <A href="/">back</A>
    </BaseLayout>
  )
}

export default QuestDetails;
