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
          orders(first: 200) {
            edges {
              node {
                id
              }
            }
          }
        }`,
      );
      const data = await response.json();
      const orders=data.data.orders.edges;
      var result=[];
      for(let i=0;i<orders.length;i++){
        var id=orders[i].node.id;
        const response1 = await admin.graphql(
          ` query GetOrder($id: ID!) {
            order(id: $id) {
                agreements(first: 20) {
                  edges {
                    node {
                      id
                      happenedAt
                      sales(first: 10) {
                        edges {
                          node {
                            actionType
                            lineType
                            quantity
                            totalAmount {
                              shopMoney {
                                amount
                              }
                            }
                            ... on ProductSale {
                              lineItem {
                                id
                                name
                              }
                            }
                            ... on ShippingLineSale {
                              shippingLine {
                                id
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              }
            `,
            {variables: {
              id:id,
            }},
        );
        result.push(await response1.json());
      }
      return result;
  };
export default function OrdersTable(){
  const actionData = useLoaderData();
  const rows = [];
    for(let i=0;i<actionData.length;i++){
        let products="";
        let price="";
        for(let j=0;j<actionData[i].data.order.agreements.edges[0].node.sales.edges.length;j++){
          const product=actionData[i].data.order.agreements.edges[0].node.sales.edges[j];
          products=products+product.node.lineItem.name+"\n";
          price=price+product.node.totalAmount.shopMoney.amount+"\n";
        }
      rows.push([actionData[i].data.order.agreements.edges[0].node.id.substring(29),actionData[i].data.order.agreements.edges[0].node.happenedAt,
        products,price,actionData[i].data.order.agreements.edges[0].node.sales.edges.length]);
    }
return (
    <Page title="Orders detail" fullWidth>
       <DataTable
          columnContentTypes={[
            'text',
            'text',
            'text',
            'text',
            'numeric'
          ]}
          headings={[
            'Id',
            'CreatedAt',
            "Products",
            "Price",
            "Total Products"
          ]}
          rows={rows}
        />
    </Page>
  );
}