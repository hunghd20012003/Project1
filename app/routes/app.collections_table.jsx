import {
    Page,
    Card, 
    DataTable
  } from "@shopify/polaris";
  import { json } from "@remix-run/node";
import { useEffect } from "react";
import { useActionData, useNavigation, useSubmit,useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { text } from "stream/consumers";
  export const loader = async ({ request }) => {
    const {admin}=await authenticate.admin(request);
    const response = await admin.graphql(
        `#graphql
    query {
      collections(first: 5) {
        edges {
          node {
            id
            title
            handle
            updatedAt
            productsCount
            sortOrder
          }
        }
      }
    }`,
      );
      const data = await response.json();
      const collections=data.data.collections.edges;
      var result=[];
      for(let i=0;i<collections.length;i++){
        var id=collections[i].node.id;
        const response1 = await admin.graphql(
            `#graphql
            query GetCollection($id: ID!){
                collection(id: $id) {
                 id
                title
                handle
                updatedAt
                productsCount
                description
                }
            }`,{variables: {
                id:id,
              }},
        );
        result.push(await response1.json());
      }
      return result;
  };
export default function CollectionsTable(){
  const actionData = useLoaderData();
  console.log(actionData);
  const rows = [];
    for(let i=0;i<actionData.length;i++){
      rows.push([actionData[i].data.collection.id.substring(25),actionData[i].data.collection.title,
      actionData[i].data.collection.description,actionData[i].data.collection.updatedAt,
      actionData[i].data.collection.productsCount]);
    }
return (
    <Page title="Collections detail" fullWidth>
       <DataTable
          columnContentTypes={[
            'text',
            'text',
            'text',
            'text',
            'text'
          ]}
          headings={[
            'Id',
            'Collection Name',
            "Description",
            "UpdatedAt",
            "Products Count"
          ]}
          rows={rows}
        />
    </Page>
  );
}