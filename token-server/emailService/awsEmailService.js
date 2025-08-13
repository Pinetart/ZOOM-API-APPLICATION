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

    const htmlContent = `${isUpdate ? 'Meeting Details Updated' : 'New Meeting Scheduled'}
Topic: ${meetingDetails.topic}
When: ${formattedStartTime} (${meetingDetails.timezone})
Meeting ID: ${meetingDetails.id}
Zoom Account: ${meetingDetails.host_email}
Join Meeting: ${meetingDetails.join_url}`;

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
