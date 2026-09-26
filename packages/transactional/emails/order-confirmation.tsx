import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const gold = "#d4af77";
const black = "#0a0a0a";

export interface OrderItem {
  price: number;
  quantity: number;
  title: string;
}

export interface OrderConfirmationProps {
  customerName: string;
  deliveryMethod: string;
  items: OrderItem[];
  orderNumber: string;
  total: number;
}

export default function OrderConfirmation({
  customerName,
  deliveryMethod,
  items,
  orderNumber,
  total,
}: OrderConfirmationProps) {
  return (
    <Html lang="en">
      <Head />
      <Body
        style={{
          backgroundColor: "#f5f3ee",
          fontFamily: "sans-serif",
          margin: 0,
        }}
      >
        <Preview>
          Order {orderNumber} confirmed — thank you, {customerName}
        </Preview>
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            margin: "32px auto",
            maxWidth: 560,
            overflow: "hidden",
          }}
        >
          <Section
            style={{
              backgroundColor: black,
              padding: "28px 32px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                color: gold,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 4,
                margin: 0,
              }}
            >
              ReLUXURY
            </Text>
          </Section>
          <Section style={{ padding: "28px 32px" }}>
            <Heading style={{ color: black, fontSize: 22, margin: "0 0 12px" }}>
              Order confirmed
            </Heading>
            <Text style={{ color: "#333", fontSize: 15 }}>
              Hi {customerName}, thank you for shopping ReLUXURY. Order{" "}
              <strong>{orderNumber}</strong> ({deliveryMethod}) is confirmed.
            </Text>
            {items.map((item) => (
              <Text
                key={item.title}
                style={{ color: "#333", fontSize: 14, margin: "6px 0" }}
              >
                {item.quantity} × {item.title} — ${item.price.toFixed(2)}
              </Text>
            ))}
            <Text style={{ color: black, fontSize: 16, fontWeight: 700 }}>
              Total: ${total.toFixed(2)}
            </Text>
            <Text style={{ color: "#6b6259", fontSize: 13 }}>
              We&apos;ll email you again when your order is ready for pickup or
              shipped. Questions? Reply to this email or call (501) 404-8696.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

OrderConfirmation.PreviewProps = {
  customerName: "Ava",
  deliveryMethod: "pickup",
  items: [
    { price: 89, quantity: 1, title: "Pre-loved Silk Blouse" },
    { price: 120, quantity: 1, title: "Designer Tote" },
  ],
  orderNumber: "RLX-ABC123",
  total: 209,
} satisfies OrderConfirmationProps;
