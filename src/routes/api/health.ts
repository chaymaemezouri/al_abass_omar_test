import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json(
          {
            status: "ok",
            service: "avatar-candidat",
            env: "test",
            timestamp: new Date().toISOString(),
          },
          { status: 200 },
        );
      },
    },
  },
});
