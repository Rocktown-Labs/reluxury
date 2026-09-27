import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface IntakeSubmittedProps {
  customerName: string;
  itemCount: number;
  type: string;
}

export default function IntakeSubmitted({
  customerName,
  itemCount,
  type,
}: IntakeSubmittedProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ backgroundColor: "#f5f3ee", fontFamily: "sans-serif", margin: 0 }}>
        <Preview>We received your consignment submission</Preview>
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            margin: "32px auto",
            maxWidth: 560,
            overflow: "hidden",
          }}
        >
          <Section style={{ backgroundColor: "#0a0a0a", padding: "28px 32px", textAlign: "center" }}>
            <Text style={{ color: "#d4af77", fontSize: 20, fontWeight: 700, letterSpacing: 4, margin: 0 }}>
              ReLUXURY
            </Text>
          </Section>
          <Section style={{ padding: "28px 32px" }}>
            <Heading style={{ color: "#0a0a0a", fontSize: 22, margin: "0 0 12px" }}>
              Submission received
            </Heading>
            <Text style={{ color: "#333", fontSize: 15 }}>
              Hi {customerName}, we got your submission ({itemCount} items,{" "}
              {type}). Our team replies within 2 business days.
            </Text>
            <Button
              href="https://reluxury.shop/dashboard"
              style={{
                backgroundColor: "#d4af77",
                borderRadius: 8,
                boxSizing: "border-box",
                color: "#0a0a0a",
                display: "block",
                fontWeight: 700,
                padding: "12px 20px",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Track your submission
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

IntakeSubmitted.PreviewProps = {
  customerName: "Ava",
  itemCount: 3,
  type: "mail-in",
} satisfies IntakeSubmittedProps;
