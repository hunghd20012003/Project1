import { useEffect,useState, useCallback} from "react";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit,useLoaderData } from "@remix-run/react";
import { Line ,Doughnut} from "react-chartjs-2";
import {
  CashDollarMajor
} from '@shopify/polaris-icons';
import 'chart.js/auto'; // ADD THIS
import {
  Page,
  CalloutCard,
  Grid,
  Card,
  Text,
 Icon,
 Button, Popover, ActionList
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {

  const {admin}=await authenticate.admin(request);
  const responseProducts = await admin.graphql(
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
  const dataProducts = await responseProducts.json();
  const responseOrders = await admin.graphql(
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
  const dataOrders = await responseOrders.json();
  const responseCustomers = await admin.graphql(
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
  const dataCustomers = await responseCustomers.json();
  const responseCollections = await admin.graphql(
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
  const dataCollections = await responseCollections.json();

  const response = await admin.graphql(
    `#graphql
    query {
      orders(first: 250 reverse: true) {
        edges {
          node {
            id
            createdAt
          }
        }
      }
    }`,
  );
  const data = await response.json();
  const dataOrder=[];
  for(let i=0;i<data.data.orders.edges.length;i++){
    var products=[];
    const id=data.data.orders.edges[i].node.id;
    const response = await admin.graphql(
      `#graphql
      query getMoney($id: ID!){
        order(id: $id) {
          unpaid
          currentSubtotalPriceSet{
            shopMoney {
                amount
                currencyCode
            }
          }
          currentTotalTaxSet{
            shopMoney{
              amount
            }
          },
          updatedAt
          lineItems(first: 10){
           edges{
            node{
              id
              name
              product{
                id

                variants(first: 10){
                  
                  edges{
                      node{
                        price
                      }
                    }
                  }
                }
              }
              }
            }}
      }`,{variables: {
        id:id,
      }},
    );
    const datafromOrderId= await response.json();
    for(let k=0;k<datafromOrderId.data.order.lineItems.edges.length;k++){
      const pro=datafromOrderId.data.order.lineItems.edges[k];
      const product={
        name:pro.node.name,
        price:pro.node.product.variants.edges[0].node.price
      }
      products.push(product);
    }
    // data5.push(datafromOrderId);
    dataOrder.push({
      updatedAt:datafromOrderId.data.order.updatedAt,
      unpaid:datafromOrderId.data.order.unpaid,
      price:datafromOrderId.data.order.currentSubtotalPriceSet.shopMoney.amount,
      tax:datafromOrderId.data.order.currentTotalTaxSet.shopMoney.amount,
      productDetail:products
    })
  }
  return [dataProducts,dataOrders,dataCustomers,dataCollections,dataOrder];

};
const backgroundColors = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9966FF', '#FF9F40', '#8A2BE2', '#FF6347', '#4DB6AC', '#BA68C8',
  '#81C784', '#FFD54F', '#7986CB', '#FF8A65', '#9575CD', '#A1887F', '#FF80AB', '#FFB74D', '#AED581', '#FF5722',
  '#2196F3', '#F44336', '#9C27B0', '#E91E63', '#673AB7', '#3F51B5', '#009688', '#4CAF50', '#FFC107', '#CDDC39',
  '#FF4081', '#FF6F00', '#00BCD4', '#C2185B', '#607D8B', '#FF5252', '#536DFE', '#FF1744', '#76FF03', '#FFD740',
  '#00E676', '#40C4FF', '#FF8F00', '#5C6BC0', '#FFEA00', '#E040FB', '#689F38', '#FF3D00', '#2979FF', '#FF6E40',
  '#E57373', '#BA68C8', '#4DB6AC', '#A1887F', '#FF4081', '#FF7043', '#536DFE', '#F50057', '#76FF03', '#40C4FF',
  '#FF9100', '#00E676', '#FFD740', '#CDDC39', '#2979FF', '#FF5252', '#2979FF', '#FF4081', '#536DFE', '#FF3D00',
  '#689F38', '#FF7043', '#FFEA00', '#40C4FF', '#E040FB', '#E57373', '#76FF03', '#BA68C8', '#FF4081', '#A1887F',
  '#4DB6AC', '#FF7043', '#2979FF', '#FF4081', '#CDDC39', '#FFEA00', '#5C6BC0', '#FFD740', '#00E676', '#FF5252',
  '#536DFE', '#2979FF', '#FF4081', '#FF3D00', '#76FF03', '#FF7043', '#BA68C8', '#E040FB', '#40C4FF', '#FFD740',
  '#5C6BC0', '#E57373', '#4DB6AC', '#A1887F', '#FF4081', '#FFEA00', '#536DFE', '#2979FF', '#CDDC39', '#FF7043'
];



export default function Index() {
  const actionData = useLoaderData();
  const result=actionData[4].reduce((acc,obj)=>{
    const dateObj = new Date(obj.updatedAt);
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1; 

    const formattedDate = `${day}-${month}`;
    acc[formattedDate] = (acc[formattedDate] || 0) + parseInt(obj.price)+parseInt(obj.tax);
    return acc;
  },{});
  const resultArr = Object.keys(result).map((formattedDate) => ({
    formattedDate,
    gia_tri: result[formattedDate],
  }));
  const fiveDayOrder=[];
  const fiveDay=[]
 for(let i=4;i>=0;i--){
  const now = new Date();

  // Sao chép thời gian hiện tại để tránh thay đổi giá trị gốc
  const day = new Date(now);
  
  // Đặt ngày của yesterday thành ngày hôm qua
  day.setDate(now.getDate() - i);
  const formattedDate = `${day.getDate()}-${day.getMonth()+1}`;
  fiveDay.push(formattedDate);
  const matchingObj = resultArr.find(obj => {
    const objDate = obj.formattedDate;
    return objDate === formattedDate;
  });
  if (matchingObj) {
    fiveDayOrder.push(matchingObj.gia_tri);
  }
  else fiveDayOrder.push(0);
 }
 //xử lý 5 tuần liên tục:
 const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const weeks = Array.from({ length: 5 }, (_, i) => {
    const startOfCurrentWeek = new Date(startOfWeek);
    startOfCurrentWeek.setDate(startOfWeek.getDate() - 7 * i); // Di chuyển lùi i tuần
    startOfCurrentWeek.setHours(0, 0, 0, 0);
    const endOfCurrentWeek = new Date(startOfCurrentWeek);
    endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 6); // Chuyển đến ngày cuối cùng của tuần
    endOfCurrentWeek.setHours(23, 59, 59, 999);
    return { start: startOfCurrentWeek,
     end: endOfCurrentWeek };
  });
  //lọc số liệu theo thời gian từng tuần
  var dataOfFiveWeeks=[];
  for(let i=0;i<5;i++){
    const weekStart= weeks[i].start;
    const weekEnd= weeks[i].end;
    var sum=0;
    for(let j=0;j<actionData[4].length;j++){
      if(new Date(actionData[4][j].updatedAt)>=weekStart&&new Date(actionData[4][j].updatedAt)<=weekEnd){
        sum+=parseInt(actionData[4][j].price);
        sum+=parseInt(actionData[4][j].tax);
      }
    }
    dataOfFiveWeeks.push(sum);
  }
  const [active, setActive] = useState(false);
  const [dataOrderLine,setData]=useState({
    label:fiveDay,
    value:fiveDayOrder
  });
  const toggleActive = useCallback(() => setActive(!active), []);

  const handleFiveDayAction = useCallback(
    () => {
      console.log(active);  
      setActive(!active);
      setData(prevData => ({ ...prevData, label: fiveDay, value: fiveDayOrder }))
      
    },
    [active],
  );
  const handleFiveWeeksAction = useCallback(
    () => {
      console.log(active);
      setActive(!active);
      let week=[];
      for(let i=0;i<5;i++){
        const start = weeks[i].start;
        const end = weeks[i].end;

        const formattedStart = `${start.getDate()}/${start.getMonth() + 1}`;
        const formattedEnd = `${end.getDate()}/${end.getMonth() + 1}`;

        week.push(`${formattedStart} - ${formattedEnd}`);
      }
      const rWeek=week.reverse();
      const rDataOfFiveWeeks=dataOfFiveWeeks.reverse();
      setData(prevData => ({ ...prevData, label: (rWeek.reverse()), value: (rDataOfFiveWeeks.reverse())}));
      
    },
    [active],
  );

  const activator = (
    <Button onClick={toggleActive} disclosure>
      Select
    </Button>
  );
  //*******************************************************************************D** */
  /*****************xử lý bảng thứ 2 */
  var Today=new Date();
  var fiveDayAgo=new Date();
  fiveDayAgo.setDate(Today.getDate()-5);
  Today.setHours(23,59,59,999);
  fiveDayAgo.setHours(0,0,0,0);
  var fiveDayProduct=[];
  var numberfiveDayProduct=[];
  for(let i=0;i<actionData[4].length;i++){
    if(new Date(actionData[4][i].updatedAt)>=fiveDayAgo&&new Date(actionData[4][i].updatedAt)<=Today){
        for(let j=0;j<actionData[4][i].productDetail.length;j++){
            let index=fiveDayProduct.indexOf(actionData[4][i].productDetail[j].name);
            if(index===-1){
              fiveDayProduct.push(actionData[4][i].productDetail[j].name);
              numberfiveDayProduct.push(parseInt(actionData[4][i].productDetail[j].price));
             
            }
            else{
              numberfiveDayProduct[index]+=parseInt(actionData[4][i].productDetail[j].price);
           
            }
        }
    }
  }
  var dataProductsWithfiveDay  = {
    labels: fiveDayProduct,
    datasets: [
      {
        label: `Total:`,
        data: numberfiveDayProduct,
        backgroundColor:backgroundColors.slice(0,fiveDayProduct.length),
        borderColor: backgroundColors.slice(0,fiveDayProduct.length),
        borderWidth: 1,
      },
    ],
  };
  ///sử lý cho biểu đồ tròn với 5 tuần
  var endOfWeek=new Date();
  endOfWeek.setDate(startOfWeek.getDate()+6);
  endOfWeek.setHours(23,59,59,999);
  var startOfFiveWeekAgo=new Date();
  startOfFiveWeekAgo.setDate(startOfWeek.getDate()-4*7)
  startOfFiveWeekAgo.setHours(0,0,0,0);
  var fiveWeekProduct=[];
  var numberfiveWeekProduct=[];
  for(let i=0;i<actionData[4].length;i++){
    if(new Date(actionData[4][i].updatedAt)>=startOfFiveWeekAgo&&new Date(actionData[4][i].updatedAt)<=endOfWeek){
        for(let j=0;j<actionData[4][i].productDetail.length;j++){
            let index=fiveWeekProduct.indexOf(actionData[4][i].productDetail[j].name);
            if(index===-1){
              fiveWeekProduct.push(actionData[4][i].productDetail[j].name);
              numberfiveWeekProduct.push(parseInt(actionData[4][i].productDetail[j].price));
             
            }
            else{
              numberfiveWeekProduct[index]+=parseInt(actionData[4][i].productDetail[j].price);
           
            }
        }
    }
  }
  var dataProductsWithfiveWeek  = {
    labels: fiveWeekProduct,
    datasets: [
      {
        label: `Total:`,
        data: numberfiveWeekProduct,
        backgroundColor:backgroundColors.slice(0,fiveWeekProduct.length),
        borderColor: backgroundColors.slice(0,fiveWeekProduct.length),
        borderWidth: 1,
      },
    ],
  };

  //actionList cho pie chart
  const [activePie, setActivePie] = useState(false);
  const [dataProductssPie,setdataProductssPie]=useState(dataProductsWithfiveDay);
  const toggleActivePie = useCallback(() => setActivePie((activePie) => !activePie), []);

  const handleProductsFiveDayActionPie = useCallback(
    () => {
      setActivePie(!activePie);
      setdataProductssPie(dataProductsWithfiveDay);
    },
    [activePie],
  );

  const handleProductsFiveWeekActionPie = useCallback(
    () => {
      setActivePie(!activePie);
      setdataProductssPie(dataProductsWithfiveWeek);
    },
    [activePie],
  );

  const activatorPie = (
    <Button onClick={toggleActivePie} disclosure>
      More actions
    </Button>
  );
  return (
    <Page fullWidth>
      <ui-title-bar title="STATISTIC STORE"></ui-title-bar>
      <Grid>
        <Grid.Cell columnSpan={{ md: 6, xl: 3 }}>
          <CalloutCard
            title="TOTAL PRODUCTS"
            illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
            primaryAction={{
              content: "Customize checkout",
              url: "/app/products_table",
            }}
          >
            <p>{actionData[0].data.products.edges.length}</p>
          </CalloutCard>
        </Grid.Cell>
        <Grid.Cell columnSpan={{ md: 6, xl: 3 }}>
          <CalloutCard
            title="TOTAL ORDERS"
            illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
            primaryAction={{
              content: "Customize checkout",
              url: "/app/orders_table",
            }}
          >
            <p>{actionData[1].data.orders.edges.length}</p>
          </CalloutCard>
        </Grid.Cell>
        <Grid.Cell columnSpan={{ md: 6, xl: 3 }}>
          <CalloutCard
            title="TOTAL CUSTOMERS"
            illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
            primaryAction={{
              content: "Customize checkout",
              url: "/app/customers_table",
            }}

          >
            <p>{actionData[2].data.customers.edges.length}</p>
          </CalloutCard>
        </Grid.Cell>
        <Grid.Cell columnSpan={{ md: 6, xl: 3 }}>
          <CalloutCard
            title="TOTAL COLLECTIONS"
            illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
            primaryAction={{
              content: "Customize checkout",
              url: "/app/collections_table",
            }}
          >
            <p>{actionData[3].data.collections.edges.length}</p>
          </CalloutCard>
        </Grid.Cell>
        <Grid.Cell columnSpan={{ md: 6, xl: 3 ,lg:8 }} row='200px'>
        <Card >
        <div style={{height: '50px'}}>
      <Popover
        active={active}
        activator={activator}
        autofocusTarget="first-node"
        onClose={toggleActive}
      >
        <ActionList
          actionRole="menuitem"
          items={[
            {
              content: 'Last Five Days',
              onAction: handleFiveDayAction,
            },
            {
              content: 'Last Five Weeks',
              onAction: handleFiveWeeksAction,
            },
          ]}
        />
      </Popover>
    </div>
      <Line
       data={{
       // x-axis label values
       labels: dataOrderLine.label,
       datasets: [
          {
              label: "revenue",
              // y-axis data plotting values
              data: dataOrderLine.value,
              fill: false,
              borderWidth:4,
              backgroundColor: "rgb(255, 99, 132)",
              borderColor:'green',
              responsive:true
            },
          ],
        }}
      />
    </Card>
    
        </Grid.Cell>
        <Grid.Cell columnSpan={{ md: 6, xl: 3, lg:4}}>
          <Card>
          <div style={{height: '50px'}}>
      <Popover
        active={activePie}
        activator={activatorPie}
        autofocusTarget="first-node"
        onClose={toggleActivePie}
      >
        <ActionList
          actionRole="menuitem"
          items={[
            {
              content: 'Last Five Days',
              onAction: handleProductsFiveDayActionPie,
            },
            {
              content: 'Last Five Weeks',
              onAction: handleProductsFiveWeekActionPie,
            },
          ]}
        />
      </Popover>
    </div>
          <Doughnut data={dataProductssPie} />
          </Card>
        </Grid.Cell>
      </Grid>
      
    </Page>
  );
}
