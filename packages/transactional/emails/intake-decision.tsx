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

export interface IntakeDecisionProps {
  customerName: string;
  decision: "approved" | "declined";
  offerAmount?: number | null;
}

export default function IntakeDecision({
  customerName,
  decision,
  offerAmount,
}: IntakeDecisionProps) {
  const hasOffer =
    decision === "approved" &&
    typeof offerAmount === "number" &&
    offerAmount > 0;
  return (
    <Html lang="en">
      <Head />
      <Body style={{ backgroundColor: "#f5f3ee", fontFamily: "sans-serif", margin: 0 }}>
        <Preview>
          {decision === "approved"
            ? "Good news about your submission"
            : "Update on your submission"}
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
          <Section style={{ backgroundColor: "#0a0a0a", padding: "28px 32px", textAlign: "center" }}>
            <Text style={{ color: "#d4af77", fontSize: 20, fontWeight: 700, letterSpacing: 4, margin: 0 }}>
              ReLUXURY
            </Text>
          </Section>
          <Section style={{ padding: "28px 32px" }}>
            <Heading style={{ color: "#0a0a0a", fontSize: 22, margin: "0 0 12px" }}>
              {decision === "approved" ? "Good news!" : "Update"}
            </Heading>
            <Text style={{ color: "#333", fontSize: 15 }}>
              Hi {customerName},{" "}
              {decision === "approved"
                ? "we'd love to take your items."
                : "we're passing on your items this time."}
            </Text>
            {hasOffer && (
              <>
                <Text style={{ color: "#333", fontSize: 15 }}>
                  Our offer: <strong>${offerAmount?.toFixed(2)}</strong>
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
                  Review offer
                </Button>
              </>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

IntakeDecision.PreviewProps = {
  customerName: "Ava",
  decision: "approved",
  offerAmount: 120,
} satisfies IntakeDecisionProps;
