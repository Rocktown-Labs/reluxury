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

const gold = "#d4af77";
const black = "#0a0a0a";

function Shell({
  preview,
  children,
}: {
  children: React.ReactNode;
  preview: string;
}) {
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
        <Preview>{preview}</Preview>
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
            <Text
              style={{
                color: "#ffffff",
                fontSize: 11,
                letterSpacing: 2,
                margin: "4px 0 0",
              }}
            >
              EST. 2025 · MAUMELLE, AR
            </Text>
          </Section>
          <Section style={{ padding: "28px 32px" }}>{children}</Section>
          <Section style={{ backgroundColor: "#faf8f4", padding: "20px 32px" }}>
            <Text style={{ color: "#6b6259", fontSize: 12, margin: 0 }}>
              14217 Corvallis Rd, Ste F · Maumelle, AR 72113 · (501) 404-8696
            </Text>
            <Text style={{ color: "#6b6259", fontSize: 12, margin: "4px 0 0" }}>
              Tue–Fri 10am–6pm · Sat 10am–5pm · Sun–Mon Closed
            </Text>
            <Text style={{ color: "#6b6259", fontSize: 12, margin: "4px 0 0" }}>
              https://reluxury.shop
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export interface WorkshopConfirmProps {
  attendeeName: string;
  endDate?: string;
  instructor?: string;
  location?: string;
  startDate: string;
  title: string;
}

export default function WorkshopRegistrationConfirm({
  attendeeName,
  endDate,
  instructor,
  location,
  startDate,
  title,
}: WorkshopConfirmProps) {
  return (
    <Shell preview={`You're in, ${attendeeName} — ${title}`}>
      <Heading style={{ color: black, fontSize: 22, margin: "0 0 12px" }}>
        You&apos;re registered!
      </Heading>
      <Text style={{ color: "#333", fontSize: 15 }}>
        Hi {attendeeName}, we got you — your spot for <strong>{title}</strong>{" "}
        is confirmed.
      </Text>
      <Text style={{ color: "#333", fontSize: 14 }}>
        📅 {startDate}
        {endDate ? ` – ${endDate}` : ""}
        <br />📍 {location ?? "ReLUXURY Boutique, Maumelle AR"}
        {instructor ? (
          <>
            <br />
            👩‍🏫 {instructor}
          </>
        ) : null}
      </Text>
      <Button
        href="https://reluxury.shop/dashboard"
        style={{
          backgroundColor: gold,
          borderRadius: 8,
          boxSizing: "border-box",
          color: black,
          display: "block",
          fontWeight: 700,
          padding: "12px 20px",
          textAlign: "center",
          textDecoration: "none",
        }}
      >
        View my workshops
      </Button>
      <Text style={{ color: "#6b6259", fontSize: 13 }}>
        Free workshop — just show up a few minutes early. Reply to this email if
        you need to cancel so we can open your seat.
      </Text>
    </Shell>
  );
}

WorkshopRegistrationConfirm.PreviewProps = {
  attendeeName: "Ava",
  instructor: "ReLUXURY Studio",
  location: "ReLUXURY Boutique, Maumelle AR",
  startDate: "Sat, Oct 4 · 11:00 AM",
  title: "Intro to Luxury Resale Styling",
} satisfies WorkshopConfirmProps;
