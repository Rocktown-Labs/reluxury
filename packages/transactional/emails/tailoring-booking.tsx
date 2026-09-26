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

export interface TailoringBookingProps {
  customerName: string;
  preferredDate: string;
  serviceType: string;
}

export default function TailoringBooking({
  customerName,
  preferredDate,
  serviceType,
}: TailoringBookingProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ backgroundColor: "#f5f3ee", fontFamily: "sans-serif", margin: 0 }}>
        <Preview>Tailoring request received — {serviceType}</Preview>
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
              Request received
            </Heading>
            <Text style={{ color: "#333", fontSize: 15 }}>
              Hi {customerName}, we got your tailoring request for{" "}
              <strong>{serviceType}</strong> ({preferredDate}). We&apos;ll
              confirm your appointment shortly.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

TailoringBooking.PreviewProps = {
  customerName: "Ava",
  preferredDate: "Sat, Oct 11",
  serviceType: "Hemming",
} satisfies TailoringBookingProps;
