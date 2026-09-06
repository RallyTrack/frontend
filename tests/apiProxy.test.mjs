import assert from "node:assert/strict";
import test from "node:test";

import { resolveApiProxyTarget } from "../config/apiProxy.ts";

test("설정이 없으면 로컬 백엔드를 사용한다", () => {
  assert.equal(resolveApiProxyTarget(), "http://localhost:8080");
  assert.equal(resolveApiProxyTarget("   "), "http://localhost:8080");
});

test("배포 백엔드 origin을 로컬 테스트 대상으로 사용할 수 있다", () => {
  assert.equal(
    resolveApiProxyTarget(" https://app.rallytrack.win/api/ "),
    "https://app.rallytrack.win",
  );
});

test("HTTP 계열이 아닌 URL은 거부한다", () => {
  assert.throws(
    () => resolveApiProxyTarget("file:///tmp/backend"),
    /http 또는 https/,
  );
});

test("URL에 포함된 인증 정보는 거부한다", () => {
  assert.throws(
    () => resolveApiProxyTarget("https://user:secret@example.com"),
    /인증 정보/,
  );
});
