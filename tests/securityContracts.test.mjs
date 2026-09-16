import assert from "node:assert/strict";
import test from "node:test";
import { videoSelectionError } from "../src/utils/uploadPolicy.ts";
import { isAnalysisPending } from "../src/api/reportStatus.ts";
import { fetchBriefing } from "../src/api/briefingApi.ts";

test("only an owned, explicitly pending report shows analysis preparation", () => {
  assert.equal(isAnalysisPending({status:404,errorCode:"ANALYSIS_NOT_READY"}), true);
  for (const error of [{status:404},{status:404,errorCode:"RESOURCE_NOT_FOUND"},{status:409,errorCode:"ANALYSIS_FAILED"},{status:409,errorCode:"ANALYSIS_RESULT_UNAVAILABLE"}]) {
    assert.equal(isAnalysisPending(error),false);
  }
});
test("video selection accepts supported formats up to the byte limit", () => {
  for (const [name,type] of [["match.mp4","video/mp4"],["match.MOV","video/quicktime"],["match.webm","video/webm"],["match.mp4",""]]) {
    assert.equal(videoSelectionError({name,type,size:500*1024*1024}),null);
  }
});
test("empty, oversized, executable and mismatched files are rejected", () => {
  for (const file of [{name:"a.mp4",type:"video/mp4",size:0},{name:"a.mp4",type:"video/mp4",size:500*1024*1024+1},{name:"a.svg",type:"image/svg+xml",size:1},{name:"a.mp4",type:"text/html",size:1}]) {
    assert.equal(typeof videoSelectionError(file),"string");
  }
});
test("briefing sends only the chosen player to the authenticated backend and forwards abort", async () => {
  const oldFetch = globalThis.fetch; const oldStorage = globalThis.localStorage;
  const controller = new AbortController();
  globalThis.localStorage = {getItem:()=>"test-access-token"};
  globalThis.fetch = async (url,options) => {
    assert.equal(url,"/api/v1/videos/7/briefing"); assert.equal(options.method,"POST");
    assert.deepEqual(JSON.parse(options.body),{player:"top"});
    assert.equal(options.headers.Authorization,"Bearer test-access-token"); assert.equal(options.signal,controller.signal);
    return Response.json({data:{videoId:7,player:"top",text:"coaching"}});
  };
  try { assert.equal(await fetchBriefing(7,"top",controller.signal),"coaching"); }
  finally { globalThis.fetch = oldFetch; globalThis.localStorage = oldStorage; }
});
test("briefing rejects mismatched responses and shows rate-limit errors", async () => {
  const oldFetch = globalThis.fetch; const oldStorage = globalThis.localStorage;
  globalThis.localStorage = {getItem:()=>"test"};
  try {
    globalThis.fetch = async () => Response.json({data:{videoId:8,player:"top",text:"wrong video"}});
    await assert.rejects(fetchBriefing(7,"top"),/응답/);
    globalThis.fetch = async () => Response.json({},{status:429});
    await assert.rejects(fetchBriefing(7,"top"),/요청이 많/);
  } finally { globalThis.fetch = oldFetch; globalThis.localStorage = oldStorage; }
});
