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

export interface WorkshopReminderProps {
  attendeeName: string;
  location?: string;
  startDate: string;
  title: string;
}

export default function WorkshopReminder({
  attendeeName,
  location,
  startDate,
  title,
}: WorkshopReminderProps) {
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
          Reminder: {title} is coming up — {startDate}
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
              See you soon, {attendeeName}
            </Heading>
            <Text style={{ color: "#333", fontSize: 15 }}>
              Quick reminder — <strong>{title}</strong> is coming up.
            </Text>
            <Text style={{ color: "#333", fontSize: 14 }}>
              📅 {startDate}
              <br />📍 {location ?? "ReLUXURY Boutique, Maumelle AR"}
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
              View details
            </Button>
            <Text style={{ color: "#6b6259", fontSize: 13 }}>
              Can&apos;t make it? Reply to let us know so we can release your
              seat.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

WorkshopReminder.PreviewProps = {
  attendeeName: "Ava",
  location: "ReLUXURY Boutique, Maumelle AR",
  startDate: "Tomorrow · 11:00 AM",
  title: "Intro to Luxury Resale Styling",
} satisfies WorkshopReminderProps;
