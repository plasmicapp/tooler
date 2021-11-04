import * as React from "react";
import { PlasmicCanvasHost } from "@plasmicapp/loader-nextjs";
import Head from "next/head";
// Some Next.js app configurations will cause a plain `import '../plasmic-init'` to be ignored.
import { PLASMIC } from "../plasmic-init";
import {
  RestQuery,
  TButton,
  TDebug,
  TInput,
  TProvider,
  TSelect,
  TTable,
  TText,
} from "../components/Components";

export default function Host() {
  return (
    <TProvider debug defaultEnv={{}}>
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
        <div>
          <TDebug />
          <RestQuery
            name={"users"}
            urlExpr={`"http://localhost:3000/api/fetch?path=/api/v1/admin/users"`}
            method={"GET"}
          />
          <RestQuery
            name={"userProjects"}
            urlExpr={`"http://localhost:3000/api/fetch?path=/api/v1/admin/projects"`}
            method={"POST"}
            runWhen={"always"}
            disableExpr={`!selectedUser?.value`}
            bodyExpr={`{ownerId: users?.value?.users.find(u => u.email === selectedUser?.value)?.id}`}
          />
          <RestQuery
            name={"cloneProject"}
            urlExpr={`"http://localhost:3000/api/fetch?path=/api/v1/admin/clone"`}
            method={"POST"}
            bodyExpr={`{projectId: projectIdToClone?.value}`}
          />
          {/*<TInput*/}
          {/*  name={"userSearch"}*/}
          {/*  labelExpr={`"Search for user"`}*/}
          {/*  placeholderExpr={`"Enter something here"`}*/}
          {/*/>*/}
          {/*<TTable*/}
          {/*  name={"usersTable"}*/}
          {/*  dataExpr={`users?.value?.users.filter(row => JSON.stringify(row).includes(userSearch?.value))`}*/}
          {/*/>*/}
          {/*<TSelect*/}
          {/*  name={"selectedUser"}*/}
          {/*  labelExpr={`"Select a user"`}*/}
          {/*  optionsExpr={`users?.value?.users.map(u => u.email)`}*/}
          {/*/>*/}
          {/*<TTable*/}
          {/*  name={"projectsTable"}*/}
          {/*  dataExpr={`userProjects?.value?.projects`}*/}
          {/*/>*/}
          <TInput
            name={"projectIdToClone"}
            labelExpr={`"Project ID to clone"`}
            placeholderExpr={`"Enter something here"`}
          />
          <TButton onClickAction={`[{"query": "cloneProject"}]`}>
            Clone project
          </TButton>
          <TText textExpr={"foo"} />
        </div>
      </div>
    </TProvider>
  );
}
