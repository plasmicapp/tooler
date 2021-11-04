import * as React from "react";
import { PlasmicCanvasHost } from "@plasmicapp/loader-nextjs";
import Head from "next/head";
// Some Next.js app configurations will cause a plain `import '../plasmic-init'` to be ignored.
import { PLASMIC } from "../plasmic-init";

export default function Host() {
  return (
    PLASMIC && (
      <div>
        <Head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
          !function(){const n=window,i="__REACT_DEVTOOLS_GLOBAL_HOOK__",o="__PlasmicPreambleVersion",t=function(){}
  if(void 0!==n){if(n.parent!==n)try{n[i]=n.parent[i]}catch(e){}if(!n[i]){const r=new Map
  n[i]={supportsFiber:!0,renderers:r,inject:function(n){r.set(r.size+1,n)},onCommitFiberRoot:t,onCommitFiberUnmount:t}}n[i][o]||(n[i][o]
="1")}}()`,
            }}
          ></script>
        </Head>
        <PlasmicCanvasHost />
      </div>
    )
  );
}
