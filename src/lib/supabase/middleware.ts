import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  clientHasProject,
  resolvePostAuthRedirect,
  teamHasProject,
} from "@/lib/auth/onboarding";
import { roleCanAccessPath } from "@/lib/auth/roles";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/client") ||
    path.startsWith("/manager") ||
    path.startsWith("/team") ||
    path.startsWith("/waiting") ||
    path.startsWith("/onboarding");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    const destination = await resolvePostAuthRedirect(supabase, user.id);

    if (path.startsWith("/onboarding")) {
      const url = request.nextUrl.clone();
      url.pathname = destination;
      return NextResponse.redirect(url);
    }

    if (
      (role === "unassigned" ||
        (role === "client" && !(await clientHasProject(supabase, user.id))) ||
        (role === "team" && !(await teamHasProject(supabase, user.id)))) &&
      (path.startsWith("/client") ||
        path.startsWith("/team") ||
        path === "/")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/waiting";
      return NextResponse.redirect(url);
    }

    if (isProtected && path !== "/waiting") {
      if (!roleCanAccessPath(role, path)) {
        const url = request.nextUrl.clone();
        url.pathname = destination;
        return NextResponse.redirect(url);
      }
    }

    if (path === "/waiting" && destination !== "/waiting") {
      const url = request.nextUrl.clone();
      url.pathname = destination;
      return NextResponse.redirect(url);
    }

    if (user && path === "/") {
      const url = request.nextUrl.clone();
      url.pathname = destination;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
