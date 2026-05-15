import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faEnvelope,
  faUser,
  faTag,
  faComment,
  faClock,
  faShieldAlt,
  faLifeRing,
} from '@fortawesome/free-solid-svg-icons';
import {
  faTwitter,
  faLinkedin,
  faGithub,
  faDiscord,
} from '@fortawesome/free-brands-svg-icons';
import { submitContactForm } from '../services/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await submitContactForm(
        formData.name,
        formData.email,
        formData.subject,
        formData.message
      );

      if (response.status === 'success') {
        setShowSuccess(true);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });

        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      alert('Error sending message: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative z-10 flex items-center justify-center min-h-screen px-6">
      <div className="contact-container max-w-4xl mx-auto">
        <div className="contact-card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="contact-icon mb-4">
              <FontAwesomeIcon icon={faPaperPlane} className="text-6xl logo-shield" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Contact <span className="logo-shield">WebSecura</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Get in touch with our security experts
            </p>
            <div className="contact-divider"></div>
          </div>

          {/* Contact Content */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="contact-form-section">
              <h2 className="text-2xl font-semibold mb-6 text-green-400">
                <FontAwesomeIcon icon={faEnvelope} className="mr-3" />
                Send us a Message
              </h2>

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    <FontAwesomeIcon icon={faTag} className="mr-2" />
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="form-input"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a topic...</option>
                    <option value="general">General Inquiry</option>
                    <option value="security">Security Question</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="partnership">Partnership</option>
                    <option value="support">Technical Support</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    <FontAwesomeIcon icon={faComment} className="mr-2" />
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    className="form-input"
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-button" disabled={isSubmitting}>
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="contact-info-section">
              <h2 className="text-2xl font-semibold mb-6 text-green-400">
                <FontAwesomeIcon icon={faEnvelope} className="mr-3" />
                Get in Touch
              </h2>

              <div className="contact-methods space-y-6">
                <div className="contact-method">
                  <div className="contact-method-icon">
                    <FontAwesomeIcon icon={faEnvelope} className="text-green-400" />
                  </div>
                  <div className="contact-method-content">
                    <h3 className="font-semibold text-white">Email Us</h3>
                    <p className="text-gray-300">hello@websecura.com</p>
                    <p className="text-sm text-gray-400">
                      We typically respond within 24 hours
                    </p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="contact-method-icon">
                    <FontAwesomeIcon icon={faClock} className="text-green-400" />
                  </div>
                  <div className="contact-method-content">
                    <h3 className="font-semibold text-white">Business Hours</h3>
                    <p className="text-gray-300">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-gray-300">Saturday: 10:00 AM - 4:00 PM</p>
                    <p className="text-sm text-gray-400">GMT timezone</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="contact-method-icon">
                    <FontAwesomeIcon icon={faShieldAlt} className="text-green-400" />
                  </div>
                  <div className="contact-method-content">
                    <h3 className="font-semibold text-white">Security Reports</h3>
                    <p className="text-gray-300">security@websecura.com</p>
                    <p className="text-sm text-gray-400">
                      For reporting security vulnerabilities
                    </p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="contact-method-icon">
                    <FontAwesomeIcon icon={faLifeRing} className="text-green-400" />
                  </div>
                  <div className="contact-method-content">
                    <h3 className="font-semibold text-white">Support</h3>
                    <p className="text-gray-300">support@websecura.com</p>
                    <p className="text-sm text-gray-400">
                      Technical support and assistance
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="social-section mt-8 pt-6 border-t border-gray-600">
                <h3 className="text-lg font-semibold mb-4 text-green-400">Follow Us</h3>
                <div className="social-links">
                 <button className="social-link" onClick={() => {}}>
  <FontAwesomeIcon icon={faTwitter} />
</button>
<button className="social-link" onClick={() => {}}>
  <FontAwesomeIcon icon={faLinkedin} />
</button>
<button className="social-link" onClick={() => {}}>
  <FontAwesomeIcon icon={faGithub} />
</button>
<button className="social-link" onClick={() => {}}>
  <FontAwesomeIcon icon={faDiscord} />
</button>
                </div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div id="successMessage" className="success-message mt-6">
              <div className="success-content">
                <FontAwesomeIcon icon={faShieldAlt} className="text-4xl text-green-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Message Sent Successfully!
                </h3>
                <p className="text-gray-300">
                  Thank you for contacting us. We'll get back to you soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Contact;