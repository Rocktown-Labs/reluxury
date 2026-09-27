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

export interface StaffInvitationProps {
  inviteUrl: string;
  inviterName: string;
  roleTitle: string;
}

export default function StaffInvitation({
  inviteUrl,
  inviterName,
  roleTitle,
}: StaffInvitationProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ backgroundColor: "#f5f3ee", fontFamily: "sans-serif", margin: 0 }}>
        <Preview>Join the ReLUXURY team as {roleTitle}</Preview>
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
              Join the team
            </Heading>
            <Text style={{ color: "#333", fontSize: 15 }}>
              {inviterName} has invited you to join ReLUXURY as{" "}
              <strong>{roleTitle}</strong>.
            </Text>
            <Button
              href={inviteUrl}
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
              Accept invitation
            </Button>
            <Text style={{ color: "#6b6259", fontSize: 13 }}>
              This link expires in 7 days. Sign in (or create your account)
              with the invited email address first.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

StaffInvitation.PreviewProps = {
  inviteUrl: "https://reluxury.shop/accept-invite?token=abc123",
  inviterName: "ReLUXURY Admin",
  roleTitle: "tailor",
} satisfies StaffInvitationProps;
