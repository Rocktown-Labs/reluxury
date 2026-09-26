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

export interface AdminOtpProps {
  otp: string;
}

export default function AdminOtp({ otp }: AdminOtpProps) {
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
        <Preview>Your ReLUXURY admin code: {otp}</Preview>
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            margin: "32px auto",
            maxWidth: 480,
            padding: "32px",
          }}
        >
          <Section>
            <Heading style={{ color: "#0a0a0a", fontSize: 22 }}>
              Your admin sign-in code
            </Heading>
            <Text style={{ color: "#333", fontSize: 15 }}>
              Use this code to sign in as admin@reluxury.shop. Expires in 5
              minutes.
            </Text>
            <Text
              style={{
                color: "#0a0a0a",
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: 6,
              }}
            >
              {otp}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

AdminOtp.PreviewProps = { otp: "123456" } satisfies AdminOtpProps;
