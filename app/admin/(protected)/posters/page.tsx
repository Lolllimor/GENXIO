import { Suspense } from "react";
import Editor from "./Editor";

export default function PostersPage() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}
