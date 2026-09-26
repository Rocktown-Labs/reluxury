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

export interface OrderStatusProps {
  headline: string;
  message: string;
  name: string;
  orderNumber: string;
  trackingNumber?: string;
}

export default function OrderStatus({
  headline,
  message,
  name,
  orderNumber,
  trackingNumber,
}: OrderStatusProps) {
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
          {headline} — order {orderNumber}
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
              {headline}
            </Heading>
            <Text style={{ color: "#333", fontSize: 15 }}>
              Hi {name}, order <strong>{orderNumber}</strong>: {message}
            </Text>
            {trackingNumber ? (
              <Text style={{ color: "#333", fontSize: 14 }}>
                Tracking: <strong>{trackingNumber}</strong>
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

OrderStatus.PreviewProps = {
  headline: "Your order is ready for pickup",
  message: "come by Tue–Fri 10am–6pm or Sat 10am–5pm with your order number.",
  name: "Ava",
  orderNumber: "RLX-ABC123",
} satisfies OrderStatusProps;
