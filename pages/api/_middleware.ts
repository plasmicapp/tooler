import { NextFetchEvent, NextRequest } from "next/server";

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const params = req.nextUrl.searchParams;
  const path = params.get("path");
  const csrfResponse = await fetch(
    "https://studio.plasmic.app/api/v1/auth/csrf",
    {
      headers: {
        cookie: "" + process.env.SECRET_SERVER_COOKIE,
      },
      referrer: "https://studio.plasmic.app/admin",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    }
  );
  const { csrf } = await csrfResponse.json();
  // console.log({
  //   method: req.method,
  //   body: req.method === "GET" ? undefined : params.get("body") || "",
  // });
  const response = await fetch("https://studio.plasmic.app" + path, {
    method: req.method,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      cookie: "" + process.env.SECRET_SERVER_COOKIE,
      "x-csrf-token": csrf,
    },
    body: req.method === "GET" ? undefined : params.get("body") || "",
  });
  return new Response(await response.text());
}
