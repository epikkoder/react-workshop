import React from 'react';
import 'whatwg-fetch';

import EmailForm from '../components/EmailForm';
import EmailList from '../components/EmailList';
import EmailView from '../components/EmailView';

export default class App extends React.Component {
    static propTypes = {
        pollInterval: React.PropTypes.number
    }

    static defaultProps = {
        pollInterval: 2000
    }

    state = {
        emails: [],
        selectedEmailId: -1
    }

    componentDidMount() {
        this._getUpdateEmails();

        this._pollId = setInterval(
            () => this._getUpdateEmails(),
            this.props.pollInterval
        );
    }

    componentWillUnmount() {
        // Need to remember to clearInterval when the component gets
        // removed from the DOM, otherwise the interval will keep going
        // forever and leak memory
        clearInterval(this._pollId);
    }

    _getUpdateEmails() {
        return fetch('/api/emails')
            .then((res) => res.json())
            .then((emails) => this.setState({emails}))
            .catch((ex) => console.error(ex));
    }

    _handleItemSelected(selectedEmailId) {
        this.setState({selectedEmailId});
    }

    _handleItemMarkedUnread(emailId) {
        console.log(emailId, 'marked unread');
    }

    _handleEmailViewClose() {
        // We close the email view by resetting the selected email
        this.setState({
            selectedEmailId: -1
        });
    }

    _handleFormSubmit(newEmail) {
        // Make a JSON POST with the new email
        fetch('/api/emails', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newEmail)
        })
            .then((res) => res.json())
            .then(({success}) => {
                if (success) {
                    // if the email was successfully updated, we have to make
                    // a request to get the new list of emails, but we'll have
                    // to wait for the response of that request, so let's add to
                    // our state immediately and then later when the response
                    // comes back, the server-side list will update. This is mainly
                    // here to demonstrate immutable updating of data structures
                    this.setState({
                        emails: [
                            ...this.state.emails,
                            {
                                ...newEmail,
                                id: Date.now(),
                                date: `${new Date()}`,
                                unread: true
                            }
                        ]
                    });

                    // on success retrieve new emails
                    this._getUpdateEmails();
                }
                else {
                    console.error('Unable to send email!');
                }
            });
    }

    render() {
        let {emails, selectedEmailId} = this.state;
        let selectedEmail = emails.find((email) => email.id === selectedEmailId);
        let emailView;

        if (selectedEmail) {
            emailView = (
                <EmailView email={selectedEmail}
                    onClose={this._handleEmailViewClose.bind(this)}
                />
            );
        }

        return (
            <div>
                <EmailList emails={emails}
                    selectedEmailId={selectedEmailId}
                    onItemSelected={this._handleItemSelected.bind(this)}
                    onItemMarkedUnread={this._handleItemMarkedUnread.bind(this)}
                />
                {emailView}
                <EmailForm onSubmit={this._handleFormSubmit.bind(this)} />
            </div>
        );
    }
}
