import React from "react";
import { DateTimePicker } from "@atlaskit/datetime-picker";

class NoteForm extends React.Component {
	render() {
		return (
			<form
				action="/publish/note/new/"
				method="post"
				className="form form--note"
			>
				<label htmlFor="datetime">Date and time:</label>
				<DateTimePicker timeIsEditable />
				<br />

				<label htmlFor="note">Note:</label>
				<textarea
					name="note"
					id="note"
					cols="30"
					rows="10"
					placeholder="Your note..."
					required={true}
				></textarea>
				<br />

				<input type="hidden" name="h" value="note" />

				<button type="submit">Create note</button>
			</form>
		);
	}
}

export { NoteForm };
