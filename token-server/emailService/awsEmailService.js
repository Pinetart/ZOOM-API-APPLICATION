import 'dotenv/config';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { format } from 'date-fns';

const snsClient = new SNSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

export async function sendSnsNotification(meetingDetails, isUpdate = false) {
    const subject = isUpdate
        ? `Meeting Updated: ${meetingDetails.topic}`
        : `Meeting Created: ${meetingDetails.topic}`; //Subject is meeting topic.

    const formattedStartTime = format(new Date(meetingDetails.start_time), 'EEEE, MMMM d, yyyy \'at\' h:mm a');

    const htmlContent = `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; }
                h1 { color: #0e71eb; }
                p { line-height: 1.6; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${isUpdate ? 'Meeting Details Updated' : 'New Meeting Scheduled'}</h1>
                <p><strong>Topic:</strong> ${meetingDetails.topic}</p>
                <p><strong>When:</strong> ${formattedStartTime} (${meetingDetails.timezone})</p>
                <p><strong>Meeting ID:</strong> ${meetingDetails.id}</p>
                <a href="${meetingDetails.join_url}">Join Meeting</a>
            </div>
        </body>
        </html>
    `; // Email body

    const defaultMessage = `Meeting Notification: ${subject}. Join at ${meetingDetails.join_url}`;

    const messagePayload = JSON.stringify({
        default: defaultMessage, // Required default message
        email: htmlContent,      // Message for email subscribers
        email_json: { subject }  // JSON object for email
    });

    const command = new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Message: messagePayload,
        Subject: subject, 
        MessageStructure: 'json', // Tells SNS to parse the message as JSON
    });

    try {
        await snsClient.send(command);
        console.log(`✅ Notification for "${subject}" published successfully to SNS Topic.`);
    } catch (error) {
        console.error("❌ Error publishing notification to SNS:", error);
    }
}
