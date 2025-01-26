import { A } from "../router";

const Home = () => {
  return (
    <main class="w-full h-screen">
      <h1>Home Page</h1>
      <div>
        <h1 class="text-3xl font-bold underline">Hello world!</h1>
        <A href="/about">Go to About</A>
      </div>
    </main>
  );
};

export default Home;
