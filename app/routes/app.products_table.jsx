import {
    Page,
    Card, 
    DataTable
  } from "@shopify/polaris";
  import { json } from "@remix-run/node";
import { useEffect } from "react";
import { useActionData, useNavigation, useSubmit,useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
  export const loader = async ({ request }) => {
    const {admin}=await authenticate.admin(request);
    const response = await admin.graphql(
      `#graphql
    query {
      products(first: 200, reverse: true) {
        edges {
          node {
            id
            title
            handle
            resourcePublicationOnCurrentPublication {
              publication {
                name
                id
              }
              publishDate
              isPublished
            }
          }
        }
      }
    }`,
      
    );
    const data = await response.json();
    const products=data.data.products.edges;
    var result=[];
    for(let i=0;i<products.length;i++){
      var id=products[i].node.id;
      const response1 = await admin.graphql(
        ` query GetProduct($id: ID!) {
              product(id: $id) {
                availablePublicationCount
                collections(first: 5) {
                  edges {
                    node {
                      handle
                    }
                  }
                }
                createdAt
                defaultCursor
                description
                descriptionHtml
                featuredImage {
                  id
                }
                feedback {
                  details {
                    messages {
                      message
                    }
                  }
                }
                giftCardTemplateSuffix
                handle
                hasOnlyDefaultVariant
                hasOutOfStockVariants
                id
                images(first: 5) {
                  edges {
                    node {
                      id
                    }
                  }
                }
                isGiftCard
                legacyResourceId
                metafield(key: "app_key", namespace: "affiliates") {
                  description
                }
                metafields(first: 5) {
                  edges {
                    node {
                      description
                    }
                  }
                }
                onlineStorePreviewUrl
                onlineStoreUrl
                options {
                  name
                }
                priceRange {
                  maxVariantPrice {
                    amount
                  }
                  minVariantPrice {
                    amount
                  }
                }
                productType
                publicationCount
                publishedAt
                resourcePublications(first: 5) {
                  edges {
                    node {
                      isPublished
                    }
                  }
                }
                resourcePublicationOnCurrentPublication {
                  publication {
                    name
                    id
                  }
                  publishDate
                  isPublished
                }
                seo {
                  title
                }
                storefrontId
                tags
                templateSuffix
                title
                totalInventory
                totalVariants
                tracksInventory
                unpublishedPublications(first: 5) {
                  edges {
                    node {
                      name
                    }
                  }
                }
                updatedAt
                variants(first: 5) {
                  edges {
                    node {
                      displayName
                    }
                  }
                }
                vendor
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
export default function ProductsTable(){
  const actionData = useLoaderData();
  const rows = [];
    for(let i=0;i<actionData.length;i++){
      rows.push([actionData[i].data.product.legacyResourceId,actionData[i].data.product.title,
        actionData[i].data.product.description,
        actionData[i].data.product.publishedAt,actionData[i].data.product.priceRange.maxVariantPrice.amount]);
    }
  
return (
    <Page title="Products detail" fullWidth>
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
            'Product',
            'Description',
            'CreatedAt',
            'Price'
          ]}
          rows={rows}
        />
    </Page>
  );
}