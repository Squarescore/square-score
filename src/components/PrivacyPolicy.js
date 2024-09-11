import React from 'react';
import { useNavigate } from 'react-router-dom';



function PrivacyPolicy() {
    const navigate = useNavigate();
    const handleBack = () => {
        navigate(-1);
      };
  return (
    
     <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <button 
    onClick={handleBack} 
    style={{ position: 'absolute',fontFamily: "'Radio Canada', sans-serif",left: '40px', top: '30px', textDecoration: 'none',  color: 'black', backgroundColor: 'white', border: 'none', cursor: 'pointer',  }}>
    <img src="https://static.thenounproject.com/png/1875804-200.png" style={{width: '30px', opacity: '50%'}}/></button>
  
<body>
    <h1>SquareScore Privacy Policy</h1>
    <p><strong>Last Updated: 29th April, 2024</strong></p>

    <h2>1. Introduction to the Privacy Policy</h2>
    <p>This Privacy Policy provides detailed information about how SquareScore LLC ("SquareScore," "us," "we," "our") collects, uses, and manages personal information through its website, SquareScore.net, and the SquareScore platform. The policy is applicable to personal data of both teachers and students and demonstrates our commitment to respecting student data privacy laws, supporting FERPA compliance for schools, and adhering to COPPA guidelines. For more information, you can reach out to us at <a href="mailto:privacy.squarescore@gmail.com">privacy.squarescore@gmail.com</a>.</p>

    <h2>2. SquareScore Privacy Principles</h2>
    <p>SquareScore adheres to the following core privacy principles:</p>
    <ul>
        <li><strong>Minimal Data Collection:</strong> We only collect personal data that is essential for educational purposes, and any use of this data is limited to authorized educational activities or with explicit parent or student consent.</li>
        <li><strong>No Data Sales:</strong> We do not sell personal information.</li>
        <li><strong>Ad-Free Zone:</strong> We do not use your personal information for advertising purposes.</li>
        <li><strong>User Control:</strong> You have control over what personal information you share with us.</li>
        <li><strong>Data Protection:</strong> Protecting your personal information is a top priority.</li>
        <li><strong>Cybersecurity Standards:</strong> We adhere to the NIST Cybersecurity Framework to ensure data security.</li>
    </ul>
    <p>We are committed to respecting your privacy, using data solely for educational purposes, and maintaining robust security measures.</p>

    <h2>3. State-Specific Compliance</h2>
    <p>Our data handling practices comply with state-specific privacy laws, including:</p>
    <ul>
        <li><strong>California:</strong> We comply with SB-1177 SOPIPA by using your information only as described in our Terms of Service and Privacy Policy, without engaging in targeted advertising or selling your data.</li>
        <li><strong>Colorado:</strong> Information use is restricted to purposes outlined in our Terms of Service and Privacy Policy, with access granted strictly on a need-to-know basis.</li>
        <li><strong>Florida:</strong> In the event of a data breach, we will notify you as mandated by the Florida Information Protection Act of 2014.</li>
        <li><strong>Illinois:</strong> We adhere to the Student Online Personal Protection Act (SOPPA).</li>
        <li><strong>Maine:</strong> Our practices comply with Maine's Student Information Privacy Act.</li>
        <li><strong>Maryland:</strong> We do not use your information for targeted advertising.</li>
        <li><strong>New York:</strong> We comply with New York Education Law § 2-d and the Parents' Bill of Rights for Data Privacy and Security.</li>
        <li><strong>Pennsylvania:</strong> Data breach notifications will be provided as required by the Breach of Personal Information Notification Act.</li>
        <li><strong>Washington:</strong> We commit to informing you of any significant changes to this Privacy Policy.</li>
    </ul>

    <h2>4. Legal and Security Measures</h2>
    <p>We use your data to comply with legal obligations, respond to official inquiries, and protect the rights and safety of our users, ourselves, and others. Our security measures include:</p>
    <ul>
        <li><strong>Meeting Legal Obligations:</strong> Complying with applicable laws and regulations.</li>
        <li><strong>Defending Rights and Safety:</strong> Protecting privacy and property, handling legal claims, and upholding our service agreements.</li>
        <li><strong>Ensuring Compliance:</strong> Regularly reviewing our processes to ensure adherence to relevant laws and policies.</li>
        <li><strong>Combatting Misuse:</strong> Preventing fraud, unauthorized access, and other illegal activities, while safeguarding against cyber threats.</li>
    </ul>

    <h2>5. Information We Collect</h2>
    <p>We collect the following types of information to effectively provide our services:</p>
    <ul>
        <li><strong>Teacher Data:</strong> Includes personal details such as name, email address, school affiliation, class information, and feedback, as well as data linked to service-related content like assignments.</li>
        <li><strong>Student Data:</strong> Consists of login credentials (email address), identification (first and last name), academic content (assignment submissions, progress data), and course enrollment details.</li>
        <li><strong>Administrator Data:</strong> Involves login credentials and identification information similar to teacher and student data, alongside school ownership information.</li>
    </ul>
    <p>For additional data collection in partnership with schools and districts, parental/guardian rights are acknowledged, allowing parents to review or request the deletion of their child's information.</p>

    <h2>6. How We Use Your Information</h2>
    <p>We utilize the personal data collected for the following purposes:</p>
    <ul>
        <li><strong>Service Delivery:</strong> To run and protect our platform and continuously improve its features.</li>
        <li><strong>Responsive Support:</strong> To address your questions and feedback.</li>
        <li><strong>Vital Updates:</strong> To keep you informed about service changes and security issues.</li>
        <li><strong>Tailored Experience:</strong> To customize your interactions and enhance your educational experience.</li>
    </ul>
    <p>Our primary goal is to use your data solely to deliver and improve educational services.</p>

    <h2>7. Information Sharing Policy</h2>
    <p>We do not sell, rent, or exchange personal information of teachers or students. Information may be shared in the following circumstances:</p>
    <ul>
        <li><strong>User-Requested Sharing:</strong> Within the same educational institution, such as allowing teachers to view their students' grades and assignment data.</li>
        <li><strong>Approved Service Providers:</strong> We only share information with vetted third-party service providers necessary for delivering our services (e.g., cloud hosting, email delivery), provided they meet our strict privacy standards. No personal data is shared with AI service providers.</li>
        <li><strong>Legal Compliance:</strong> Personal information may be disclosed to government authorities if required by law.</li>
    </ul>
    <p>We are committed to sharing data only as necessary and ensuring maximum protection.</p>

    <h2>8. Data Protection Measures</h2>
    <p>SquareScore is committed to maintaining high standards of data protection:</p>
    <ul>
        <li><strong>Cybersecurity Commitment:</strong> We follow the NIST Cybersecurity Framework and implement stringent measures to safeguard your privacy and security.</li>
        <li><strong>Access Control:</strong> We enforce strict user permissions and use multi-factor authentication to protect access to sensitive information.</li>
        <li><strong>Data Encryption:</strong> Your data is encrypted both in transit and at rest to ensure its confidentiality.</li>
        <li><strong>Security Protocols:</strong> We have technical and procedural safeguards in place, including an incident response plan and breach notification system.</li>
    </ul>
    <p>While we take extensive measures to protect your data, we advise users to avoid sending sensitive information through unsecured channels and to remain cautious when sharing confidential information.</p>

    <h2>9. Managing Your Data</h2>
    <p>SquareScore provides you with multiple options to manage your personal information:</p>
    <ul>
        <li><strong>Account Control:</strong> You can view or update your personal information by contacting us at <a href="mailto:privacy.squarescore@gmail.com">privacy.squarescore@gmail.com</a>.</li>
        <li><strong>Student Data (For Parents):</strong> Parents can request to review or delete their child’s data by emailing <a href="mailto:privacy.squarescore@gmail.com">privacy.squarescore@gmail.com</a>.</li>
        <li><strong>School/District Access:</strong> Schools and districts have the ability to manage student data directly through our platform.</li>
        <li><strong>Account Deletion:</strong> To request deletion of your account, please contact us via <a href="mailto:privacy.squarescore@gmail.com">privacy.squarescore@gmail.com</a>. Note that while we may delete identifiable personal information, we might retain de-identified data for service improvement purposes.</li>
        <li><strong>Email Preferences:</strong> You can opt out of non-essential emails by using the unsubscribe link provided in our emails. However, you will continue to receive critical service-related communications.</li>
    </ul>
    <p>We prioritize giving you control over your data, ensuring multiple ways to manage and update your information.</p>

    <h2>10. Data Retention Policy</h2>
    <p>Our data retention practices are designed to support your educational goals:</p>
    <ul>
        <li><strong>Storage Duration:</strong> We retain data only for as long as necessary to provide our services or as authorized by you or your school.</li>
        <li><strong>Account Deactivation:</strong> If you wish to deactivate your account, please email <a href="mailto:privacy.squarescore@gmail.com">privacy.squarescore@gmail.com</a>. Upon deactivation, your account access will be blocked, and your data will be hidden from other users. Schools will no longer be able to access your information.</li>
        <li><strong>Post-Deactivation:</strong> Data may be anonymized and retained in a de-identified format for service improvement. Full deletion is available upon request.</li>
        <li><strong>School Contracts:</strong> If you are using our services through a school, the school may request account deactivation, which we will honor unless legal requirements dictate otherwise.</li>
    </ul>
    <p>Our approach ensures that you have control over the lifespan of your data while we focus on minimizing data retention.</p>

    <h2>11. For International Users</h2>
    <p>SquareScore complies with international data protection laws, ensuring transparency and rights for users outside the United States:</p>
    <ul>
        <li><strong>Data Transfer:</strong> While data may be collected in your local country, it will be transferred to and stored on servers in the United States.</li>
        <li><strong>EU/EEA/UK Rights (GDPR):</strong> Users in these regions have the right to access their data, correct inaccuracies, request erasure, limit processing, and object to processing. You can exercise these rights by contacting <a href="mailto:privacy.squarescore@gmail.com">privacy.squarescore@gmail.com</a>.</li>
        <li><strong>Additional Protections:</strong> EU/EEA/UK users have the right to lodge complaints with their local data protection authority.</li>
    </ul>
    <p>We are committed to respecting global privacy laws and facilitating international users' data requests.</p>

    <h2>12. Policy Update Process</h2>
    <p>SquareScore may periodically revise this Privacy Policy:</p>
    <ul>
        <li><strong>Notification:</strong> We will provide prominent notice of any changes to this policy, including alerts at login after updates are made.</li>
        <li><strong>User Consent:</strong> Continued use of our services following a policy update implies acceptance of the revised terms.</li>
        <li><strong>Contractual Obligations:</strong> No changes will override existing contractual agreements with schools or districts, which take precedence over individual user consent.</li>
    </ul>
    <p>Our goal is to keep you informed of any changes, ensuring transparency and consistency with existing agreements.</p>

    <h2>13. Contact Information</h2>
    <p>If you have questions or concerns about this Privacy Policy or SquareScore's privacy practices, please contact us at <a href="mailto:privacy.squarescore@gmail.com">privacy.squarescore@gmail.com</a>. We are available to provide clarifications, address inquiries, and answer any related questions.</p>
    <p>We value open communication and encourage you to reach out with feedback or privacy-related concerns. Your privacy and trust are important to us, and we are here to support you.</p>

</body>
    </div>
  );
}

export default PrivacyPolicy;