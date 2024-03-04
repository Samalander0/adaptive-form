<script>
  import { page } from '$app/stores' // Get page info (specifically, we want the slug)

  import { pb } from '$lib/pocketbase' // Import pocketbase
  import { onMount } from 'svelte' // Import onMount function (runs when the page loads)

  import '$lib/styles/form.scss' // Import styling

  let form = {}
  let elements = [] // Stores all of the elements (pages & questions) connected to the form
  let element = {} // Stores the current element being displayed
  let layer = 0
  let question = 0

  let loading = false

  let answer = ""

  onMount(async () => {
    // Get the form data
    try {
      form = await pb.collection('forms').getFirstListItem(`slug="${$page.params.slug}"`, {requestKey: null, expand: "elements"}) // Get the first item in the forms collection that has the right slug
    } catch (error) { // If there is an error...
      console.log(error) // ...log it to the console
    }

    // Get all of the elements attached to the form
    try {
      const res = await pb.collection('elements').getList(1, 200, {filter: `form="${form.id}"`, requestKey: null}) 
      elements = res.items // PB returns an object with other information, and an items field with the data we actually want, so set elements to that
    } catch (error) {
      console.log(error)
    }

    // Find the starting element and set the current element to that
    element = elements.find(element => element.type = "start")
  })

  async function newElement() { // Called when button is pressed to move to the next element
    console.log(element.options)
    if (element.options.length == 0 || element.type !== "question") { // If the current element has no follow up questions, or isn't a question, move on to a new layer
      newLayer()
      return;
    }

    loading = true;

    let query = `./../api/question-picker/?original_question=${element.title}&question_answer=${answer}`

    if (element.options[0]) {
      const question_option = elements.find(question => question.id == element.options[0]);
      query = query + `&question_option_a=${question_option.title}&question_option_a_when=${question_option.when}`
    }
    if (element.options[1]) {
      const question_option = elements.find(question => question.id == element.options[1]);
      query = query + `&question_option_b=${question_option.title}&question_option_b_when=${question_option.when}`
    }
    if (element.options[2]) {
      const question_option = elements.find(question => question.id == element.options[2]);
      query = query + `&question_option_c=${question_option.title}&question_option_c_when=${question_option.when}`
    }
    if (element.options[3]) {
      const question_option = elements.find(question => question.id == element.options[3]);
      query = query + `&question_option_d=${question_option.title}&question_option_d_when=${question_option.when}`
    }

    query = encodeURI(query);

    console.log(query)

    const response = await fetch(query)
    const output = await response.json()
    console.log(output)

    if (output == "NO") {
      newLayer()
      question++
      return;
    }
    if (output == "A") {
      element = elements.find(question => question.id == element.options[0])
    }
    if (output == "B") {
      element = elements.find(question => question.id == element.options[1])
    }
    if (output == "C") {
      element = elements.find(question => question.id == element.options[2])
    }
    if (output == "D") {
      element = elements.find(question => question.id == element.options[3])
    }

    answer = "" // Clear Form Field
    question++ // Increase question number by one
    loading = false
  }
  function newLayer() {
    console.log("Out of questions for this layer, moving on")

    if (element.type == "end") {
      submit()
      return;
    }

    layer++
    element = elements.find(new_element => new_element.layer == layer && new_element.starting);

    if (!element) {
      element = elements.find(new_element => new_element.type == "end");
    }

    if (element.type == "question") { // If new element is a question, increase the question number by one
      question++
    }

    answer = ""
    loading = false
  }

  // Create ability to press enter to move to next element
  let enter_pressed
  function checkForEnter(e) {
    if (e.key == "Enter" &&  !e.shiftKey && !enter_pressed && !loading) {
      enter_pressed = true
      newElement()
    }
  }
  function clearEnter(e) {
    if (e.key == "Enter") {
      enter_pressed = false
    }
  }

  // Handle submission
  let submitted = false
  function submit() {
    loading = true

    setTimeout(() => {submitted = true}, 2000)
  }
</script>

<svelte:head>
  <title>{form.title}</title>
</svelte:head>
<svelte:window on:keydown={checkForEnter} on:keyup={clearEnter}/>

<div class="form-body">
  <main>
    <aside>
      {#if element.type == "question"}
        <h2>
          {question} →
        </h2>
      {/if}
    </aside>
    <div class="question" data-type={element.type}>
      <h1>
        {element.title}
      </h1>
      {#if element.description}
        <p>
          {element.description}
        </p>
      {/if}

      {#if element.type == "question"}
        <input type="text" placeholder="Type your answer here..." bind:value={answer}/>
      {/if}
      
      {#if submitted}
        <small style="color: #737373;">Thanks for submitting! This form is in demo mode, so responses will not save.</small>
      {:else}
        <div>
          <button on:click={newElement} disabled={loading}>
            {#if element.type == "start"}
              Start →
            {:else if element.type == "end"}
              {#if loading}
                Submitting...
              {:else}
                Submit ✓
              {/if}
            {:else}
              Next →
            {/if}
          </button>
          {#if element.type !== "end"}
            <span class="next-prompt">
              or press enter ↵
            </span>
          {/if}
        </div>
      {/if}
    </div>
  </main>
</div>