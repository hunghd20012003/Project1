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
      customers(first: 10) {
        edges {
          node {
            id
          }
        }
      }
    }`,
      );
      const data = await response.json();
      const customers=data.data.customers.edges;
      var result=[];
      for(let i=0;i<customers.length;i++){
        var id=customers[i].node.id;
        const response1 = await admin.graphql(
            `#graphql
            query GetCustomer($id: ID!){
                customer(id: $id) {
                    email
                    firstName
                    lastName
                    phone
                    createdAt
                    defaultAddress {
                      address1
                      city
                      province
                      zip
                      country
                    }
                  }
            }`,{variables: {
                id:id,
              }},
        );
        result.push(await response1.json());
      }
      return result;
  };
export default function CustomersTable(){
  const actionData = useLoaderData();
  console.log(actionData);
  const rows = [];
    for(let i=0;i<actionData.length;i++){
      rows.push([(actionData[i].data.customer.firstName+" "+actionData[i].data.customer.lastName),actionData[i].data.customer.email,
      actionData[i].data.customer.phone,actionData[i].data.customer.defaultAddress.address1,
      actionData[i].data.customer.createdAt ]);
    }
return (
    <Page title="Customers detail" fullWidth>
       <DataTable
          columnContentTypes={[
            'text',
            'text',
            'text',
            'text',
            'text'
          ]}
          headings={[
            'Name',
            'Email',
            "Phone",
            "Address",
            "CreatedAt"
          ]}
          rows={rows}
        />
    </Page>
  );
}