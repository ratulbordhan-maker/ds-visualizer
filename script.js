/**
 * DATA STRUCTURE VISUALIZER — script.js
 * 
 * Architecture: OOP-based with separate classes for each data structure,
 * a Renderer for DOM updates, and a UI controller for interactions.
 *
 * Classes:
 *  - Stack          → Array-backed stack with LIFO semantics
 *  - Queue          → Array-backed queue with FIFO semantics
 *  - LinkedListNode → Node for singly linked list
 *  - LinkedList     → Singly linked list implementation
 *  - Renderer       → Handles all DOM / animation updates
 *  - App            → Main controller, wires everything together
 */

'use strict';

/* ============================================================
   DATA STRUCTURE CLASSES
   ============================================================ */

/**
 * Stack — LIFO structure
 * All operations O(1) time, O(n) space.
 */
class Stack {
  constructor() {
    this._data = [];
  }

  /** Push a value onto the top of the stack. */
  push(value) {
    this._data.push(value);
    return this.size;
  }

  /** Remove and return the top element. Returns undefined if empty. */
  pop() {
    return this._data.pop();
  }

  /** Return the top element without removing it. */
  peek() {
    return this._data[this._data.length - 1];
  }

  /** Number of elements. */
  get size() { return this._data.length; }

  /** True if no elements. */
  get isEmpty() { return this._data.length === 0; }

  /** Read-only copy of internal array (bottom → top). */
  get items() { return [...this._data]; }
}


/**
 * Queue — FIFO structure
 * Enqueue O(1), Dequeue O(1) amortised (shift is O(n) but acceptable for visualisation scale).
 */
class Queue {
  constructor() {
    this._data = [];
  }

  /** Add element to the rear. */
  enqueue(value) {
    this._data.push(value);
    return this.size;
  }

  /** Remove element from the front. Returns undefined if empty. */
  dequeue() {
    return this._data.shift();
  }

  /** Return the front element without removing it. */
  front() {
    return this._data[0];
  }

  get size() { return this._data.length; }
  get isEmpty() { return this._data.length === 0; }
  get items() { return [...this._data]; }
}


/**
 * LinkedListNode — a single node in a singly linked list.
 */
class LinkedListNode {
  constructor(value) {
    this.value = value;
    this.next  = null;
  }
}


/**
 * LinkedList — singly linked list.
 * Insert head: O(1), Insert tail: O(n), Delete: O(n), Search: O(n).
 */
class LinkedList {
  constructor() {
    this.head = null;
    this.size = 0;
  }

  /** Insert at the beginning (new head). */
  insertAtBeginning(value) {
    const node = new LinkedListNode(value);
    node.next  = this.head;
    this.head  = node;
    this.size++;
    return node;
  }

  /** Insert at the end (new tail). */
  insertAtEnd(value) {
    const node = new LinkedListNode(value);
    if (!this.head) {
      this.head = node;
    } else {
      let curr = this.head;
      while (curr.next) curr = curr.next;
      curr.next = node;
    }
    this.size++;
    return node;
  }

  /**
   * Delete the first node whose value equals `value`.
   * Returns true if deleted, false if not found.
   */
  delete(value) {
    if (!this.head) return false;

    // Deleting head
    if (this.head.value === value) {
      this.head = this.head.next;
      this.size--;
      return true;
    }

    let curr = this.head;
    while (curr.next) {
      if (curr.next.value === value) {
        curr.next = curr.next.next;
        this.size--;
        return true;
      }
      curr = curr.next;
    }
    return false;
  }

  /**
   * Search for a value. Returns 0-based index or -1 if not found.
   */
  search(value) {
    let curr  = this.head;
    let index = 0;
    while (curr) {
      if (curr.value === value) return index;
      curr = curr.next;
      index++;
    }
    return -1;
  }

  /** Convert list to array of values for easy rendering. */
  toArray() {
    const arr  = [];
    let curr   = this.head;
    while (curr) { arr.push(curr.value); curr = curr.next; }
    return arr;
  }

  get isEmpty() { return this.head === null; }
}


/* ============================================================
   RENDERER
   Responsible for all DOM mutations and animations.
   ============================================================ */

class Renderer {

  constructor() {
    this.stage        = document.getElementById('vizStage');
    this.emptyState   = document.getElementById('emptyState');
    this.sizeBadge    = document.getElementById('sizeBadge');
    this.messageText  = document.getElementById('messageText');
    this.messageIcon  = document.querySelector('.msg-icon');
    this.pseudocode   = document.getElementById('pseudocode');
    this.explanation  = document.getElementById('explanation');
    this.complexityGrid = document.getElementById('complexityGrid');
    this.pointerLabels  = document.getElementById('pointerLabels');
    this.toast        = document.getElementById('toast');
    this._toastTimer  = null;
  }

  /* ---- Generic helpers ---- */

  showEmpty(show) {
    this.emptyState.classList.toggle('hidden', !show);
  }

  updateSize(n) {
    this.sizeBadge.textContent = `Size: ${n}`;
  }

  setMessage(text, type = 'info') {
    const icons = { info: 'ℹ', success: '✓', error: '✕', highlight: '★' };
    this.messageIcon.textContent = icons[type] || 'ℹ';
    this.messageText.textContent = text;
    this.messageIcon.style.color = {
      info: 'var(--accent2)',
      success: 'var(--accent)',
      error: 'var(--accent3)',
      highlight: 'var(--accent4)'
    }[type] || 'var(--accent2)';
  }

  showToast(text, type = 'info') {
    clearTimeout(this._toastTimer);
    this.toast.textContent = text;
    this.toast.className   = `toast ${type} show`;
    this._toastTimer = setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2400);
  }

  clearStage() {
    // Remove all children except the empty state
    [...this.stage.children].forEach(c => {
      if (c !== this.emptyState) c.remove();
    });
  }

  /* ---- Info Panel updaters ---- */

  updateInfoPanel(ds, op) {
    const data = INFO_DATA[ds];
    if (!data) return;

    // Complexity
    this.complexityGrid.innerHTML = data.complexity
      .map(row => `
        <div class="cx-row ${row.active === op ? 'active' : ''} ${row.space ? 'cx-space' : ''}">
          <span class="cx-op">${row.op}</span>
          <span class="cx-val">${row.val}</span>
        </div>`)
      .join('');

    // Pseudocode
    const codeEntry = data.pseudocode[op] || data.pseudocode.default;
    this.pseudocode.textContent = codeEntry;

    // Explanation
    this.explanation.innerHTML = data.explanation[op] || data.explanation.default;
  }

  /* ---- Stack rendering ---- */

  renderStack(stack, highlightTop = false, highlightAll = false) {
    this.clearStage();
    this.updateSize(stack.size);
    this.showEmpty(stack.isEmpty);
    this.pointerLabels.classList.add('hidden');

    if (stack.isEmpty) return;

    const container = document.createElement('div');
    container.className = 'stack-container';

    // Base
    const base = document.createElement('div');
    base.className = 'stack-base';
    container.appendChild(base);

    // Nodes (bottom first, displayed bottom-to-top via column-reverse)
    stack.items.forEach((val, idx) => {
      const isTop = idx === stack.size - 1;
      const node  = document.createElement('div');
      node.className = 'stack-node' +
        (isTop ? ' top-node' : '') +
        (highlightAll || (highlightTop && isTop) ? ' highlighted' : '');
      node.textContent = val;
      container.appendChild(node);
    });

    this.stage.appendChild(container);
  }

  /** Animate a push: render then flash the new top node */
  animatePush(stack) {
    this.renderStack(stack);
    const nodes = this.stage.querySelectorAll('.stack-node');
    if (nodes.length) {
      const topNode = nodes[nodes.length - 1];
      topNode.classList.add('entering');
      topNode.addEventListener('animationend', () => topNode.classList.remove('entering'), { once: true });
    }
  }

  /** Animate a pop: flash top node then remove it */
  animatePop(stack, poppedValue, onDone) {
    // First show the pre-pop state with the node highlighted
    this.renderStack(stack); // stack already popped — rebuild with old items trick
    // Actually, we need to render with the popped value still visible
    // We'll call onDone after a short delay
    // The caller should pass the stack BEFORE popping for the animation
    setTimeout(onDone, 380);
  }

  /** Flash highlight on top node (peek) */
  animatePeek(stack) {
    this.renderStack(stack, true);
  }

  /* ---- Queue rendering ---- */

  renderQueue(queue, highlightFront = false, highlightAll = false) {
    this.clearStage();
    this.updateSize(queue.size);
    this.showEmpty(queue.isEmpty);
    this.pointerLabels.classList.toggle('hidden', queue.isEmpty);

    if (queue.isEmpty) return;

    const container = document.createElement('div');
    container.className = 'queue-container';

    queue.items.forEach((val, idx) => {
      const isFront = idx === 0;
      const isRear  = idx === queue.size - 1;

      const node = document.createElement('div');
      node.className = 'queue-node' +
        (isFront ? ' front-node' : '') +
        (isRear && !isFront ? ' rear-node' : '') +
        (highlightAll || (highlightFront && isFront) ? ' highlighted' : '');
      node.textContent = val;
      container.appendChild(node);

      // Arrow between nodes
      if (idx < queue.size - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'queue-arrow';
        arrow.textContent = '→';
        container.appendChild(arrow);
      }
    });

    this.stage.appendChild(container);
  }

  animateEnqueue(queue) {
    this.renderQueue(queue);
    const nodes = this.stage.querySelectorAll('.queue-node');
    if (nodes.length) {
      const last = nodes[nodes.length - 1];
      last.classList.add('entering');
      last.addEventListener('animationend', () => last.classList.remove('entering'), { once: true });
    }
  }

  animateDequeue(queue, onDone) {
    setTimeout(onDone, 380);
  }

  animateFront(queue) {
    this.renderQueue(queue, true);
  }

  /* ---- Linked List rendering ---- */

  renderLinkedList(ll, highlightIndex = -1, state = 'normal') {
    this.clearStage();
    this.updateSize(ll.size);
    this.showEmpty(ll.isEmpty);
    this.pointerLabels.classList.add('hidden');

    if (ll.isEmpty) return;

    const container = document.createElement('div');
    container.className = 'll-container';

    const items = ll.toArray();

    items.forEach((val, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'll-node-wrapper';

      const node = document.createElement('div');
      node.className = 'll-node' +
        (idx === 0 ? ' head-node' : '') +
        (idx === highlightIndex
          ? (state === 'found' ? ' found' : state === 'not-found' ? ' not-found' : ' highlighted')
          : '');

      const dataCell = document.createElement('div');
      dataCell.className = 'll-node-data';
      dataCell.textContent = val;

      const ptrCell = document.createElement('div');
      ptrCell.className = 'll-node-ptr';
      ptrCell.textContent = idx < items.length - 1 ? '→' : '∅';

      node.appendChild(dataCell);
      node.appendChild(ptrCell);
      wrapper.appendChild(node);

      // Arrow between nodes
      if (idx < items.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'll-arrow';
        arrow.textContent = '⟶';
        wrapper.appendChild(arrow);
      } else {
        // NULL terminator
        const nullEl = document.createElement('div');
        nullEl.className = 'll-null';
        nullEl.textContent = '→ null';
        wrapper.appendChild(nullEl);
      }

      container.appendChild(wrapper);
    });

    this.stage.appendChild(container);
  }

  animateLLInsert(ll, atHead = false) {
    this.renderLinkedList(ll);
    const nodes = this.stage.querySelectorAll('.ll-node');
    if (nodes.length) {
      const targetNode = atHead ? nodes[0] : nodes[nodes.length - 1];
      targetNode.classList.add('entering');
      targetNode.addEventListener('animationend', () => targetNode.classList.remove('entering'), { once: true });
    }
  }

  /** Animated search: step through nodes one by one */
  animateLLSearch(ll, value, onDone) {
    const items = ll.toArray();
    let step = 0;

    const stepThrough = () => {
      if (step >= items.length) {
        // Not found
        this.renderLinkedList(ll, -1, 'normal');
        this.setMessage(`Value ${value} not found in list.`, 'error');
        this.showToast(`${value} not found`, 'error');
        onDone && onDone(false);
        return;
      }

      this.renderLinkedList(ll, step, 'highlighted');

      if (items[step] === value) {
        // Found
        setTimeout(() => {
          this.renderLinkedList(ll, step, 'found');
          this.setMessage(`Found ${value} at index ${step}! ✓`, 'success');
          this.showToast(`Found at index ${step}`, 'success');
          onDone && onDone(true, step);
        }, 340);
        return;
      }

      step++;
      setTimeout(stepThrough, 420);
    };

    stepThrough();
  }
}


/* ============================================================
   INFO DATA
   Complexity tables, pseudocode, and explanations per DS + operation.
   ============================================================ */

const INFO_DATA = {
  stack: {
    complexity: [
      { op: 'Push',  val: 'O(1)', active: 'push'  },
      { op: 'Pop',   val: 'O(1)', active: 'pop'   },
      { op: 'Peek',  val: 'O(1)', active: 'peek'  },
      { op: 'Space', val: 'O(n)', space: true      },
    ],
    pseudocode: {
      default: `function push(value):\n  node = new Node(value)\n  stack.append(node)\n  stack.size++`,
      push:    `function push(value):\n  node = new Node(value)\n  stack.append(node)  // O(1)\n  stack.size++\n  return stack.size`,
      pop:     `function pop():\n  if stack.isEmpty:\n    raise UnderflowError\n  top = stack[stack.size - 1]\n  stack.remove(top)   // O(1)\n  stack.size--\n  return top.value`,
      peek:    `function peek():\n  if stack.isEmpty:\n    raise UnderflowError\n  return stack.top.value  // O(1)\n  // No modification`,
    },
    explanation: {
      default: `A <strong>Stack</strong> is a <strong>LIFO</strong> (Last In, First Out) structure. Elements are added and removed only from one end called the <strong>top</strong>. Think of a stack of plates — you add to the top and remove from the top.`,
      push:    `<strong>Push</strong> adds an element to the <strong>top</strong> of the stack. This is O(1) because no shifting is needed — we just add to the end of the underlying array.`,
      pop:     `<strong>Pop</strong> removes and returns the <strong>top</strong> element. The element must exist (non-empty stack). Runs in O(1) time.`,
      peek:    `<strong>Peek</strong> reads the <strong>top</strong> element without removing it. Useful to inspect the top before deciding to pop. O(1) time.`,
    }
  },

  queue: {
    complexity: [
      { op: 'Enqueue', val: 'O(1)', active: 'enqueue' },
      { op: 'Dequeue', val: 'O(1)', active: 'dequeue' },
      { op: 'Front',   val: 'O(1)', active: 'front'   },
      { op: 'Space',   val: 'O(n)', space: true        },
    ],
    pseudocode: {
      default:  `function enqueue(value):\n  node = new Node(value)\n  queue.rear.next = node\n  queue.rear = node\n  queue.size++`,
      enqueue:  `function enqueue(value):\n  node = new Node(value)\n  queue.rear.next = node // O(1)\n  queue.rear = node\n  queue.size++`,
      dequeue:  `function dequeue():\n  if queue.isEmpty:\n    raise UnderflowError\n  val = queue.front.value\n  queue.front = queue.front.next\n  queue.size--\n  return val  // O(1)`,
      front:    `function front():\n  if queue.isEmpty:\n    raise Error\n  return queue.front.value // O(1)\n  // No modification`,
    },
    explanation: {
      default: `A <strong>Queue</strong> is a <strong>FIFO</strong> (First In, First Out) structure. Think of a checkout line — the first person in line is the first to be served.`,
      enqueue: `<strong>Enqueue</strong> adds an element to the <strong>rear</strong> (back) of the queue. O(1) because we maintain a rear pointer — no traversal needed.`,
      dequeue: `<strong>Dequeue</strong> removes and returns the element at the <strong>front</strong>. This is O(1) with a front pointer. Elements can only leave from the front.`,
      front:   `<strong>Front</strong> returns the element at the front of the queue without removing it. O(1) with a front pointer. Useful for inspecting the next element.`,
    }
  },

  linkedlist: {
    complexity: [
      { op: 'Insert Head', val: 'O(1)', active: 'insertBegin' },
      { op: 'Insert Tail', val: 'O(n)', active: 'insertEnd'   },
      { op: 'Delete',      val: 'O(n)', active: 'delete'      },
      { op: 'Search',      val: 'O(n)', active: 'search'      },
      { op: 'Space',       val: 'O(n)', space: true           },
    ],
    pseudocode: {
      default:      `function insertAtHead(value):\n  node = new Node(value)\n  node.next = list.head\n  list.head = node\n  list.size++`,
      insertBegin:  `function insertAtHead(value):\n  node = new Node(value) // O(1)\n  node.next = list.head\n  list.head = node\n  list.size++`,
      insertEnd:    `function insertAtTail(value):\n  node = new Node(value)\n  curr = list.head\n  while curr.next != null: // O(n)\n    curr = curr.next\n  curr.next = node\n  list.size++`,
      delete:       `function delete(value):\n  if head.value == value:\n    head = head.next  // O(1)\n  curr = head\n  while curr.next != null: // O(n)\n    if curr.next.value == value:\n      curr.next = curr.next.next\n      return true\n    curr = curr.next\n  return false`,
      search:       `function search(value):\n  curr = head\n  index = 0\n  while curr != null: // O(n)\n    if curr.value == value:\n      return index\n    curr = curr.next\n    index++\n  return -1  // not found`,
    },
    explanation: {
      default:     `A <strong>Singly Linked List</strong> is a sequence of <strong>nodes</strong>, where each node stores a value and a pointer to the <strong>next</strong> node. The last node points to <strong>null</strong>.`,
      insertBegin: `<strong>Insert at Head</strong> creates a new node and makes it the new head by pointing it to the old head. O(1) — no traversal needed.`,
      insertEnd:   `<strong>Insert at Tail</strong> traverses the entire list to find the last node, then appends. O(n) because we must reach the end.`,
      delete:      `<strong>Delete</strong> searches for the node with the given value and removes it by relinking the previous node's <strong>next</strong> pointer. O(n) traversal.`,
      search:      `<strong>Search</strong> walks the list from head to tail, comparing each node's value. Returns the 0-based index or -1 if not found. O(n).`,
    }
  }
};


/* ============================================================
   APP — Main Controller
   ============================================================ */

class App {
  constructor() {
    // Data structures
    this.stack      = new Stack();
    this.queue      = new Queue();
    this.linkedList = new LinkedList();

    // Renderer
    this.renderer = new Renderer();

    // State
    this.currentDS = 'stack';
    this.busy      = false; // prevent concurrent animations

    this._initUI();
    this._switchDS('stack');
  }

  /* ---- UI Wiring ---- */

  _initUI() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this._switchDS(btn.dataset.ds));
    });

    // Stack buttons
    document.querySelector('[data-op="push"]').addEventListener('click',  () => this._handlePush());
    document.querySelector('[data-op="pop"]').addEventListener('click',   () => this._handlePop());
    document.querySelector('[data-op="peek"]').addEventListener('click',  () => this._handlePeek());

    // Queue buttons
    document.querySelector('[data-op="enqueue"]').addEventListener('click',  () => this._handleEnqueue());
    document.querySelector('[data-op="dequeue"]').addEventListener('click',  () => this._handleDequeue());
    document.querySelector('[data-op="front"]').addEventListener('click',    () => this._handleFront());

    // Linked list buttons
    document.querySelector('[data-op="insertBegin"]').addEventListener('click', () => this._handleInsertBegin());
    document.querySelector('[data-op="insertEnd"]').addEventListener('click',   () => this._handleInsertEnd());
    document.querySelector('[data-op="delete"]').addEventListener('click',      () => this._handleDelete());
    document.querySelector('[data-op="search"]').addEventListener('click',      () => this._handleSearch());

    // Enter key on inputs
    ['stackInput','queueInput','llInput'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') this._triggerPrimaryOp();
      });
    });

    // Header buttons
    document.getElementById('resetBtn').addEventListener('click',  () => this._reset());
    document.getElementById('randomBtn').addEventListener('click', () => this._random());
    document.getElementById('themeBtn').addEventListener('click',  () => this._toggleTheme());
  }

  _triggerPrimaryOp() {
    const map = { stack: 'push', queue: 'enqueue', linkedlist: 'insertEnd' };
    document.querySelector(`[data-op="${map[this.currentDS]}"]`).click();
  }

  /* ---- DS Switching ---- */

  _switchDS(ds) {
    this.currentDS = ds;

    // Nav active state
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.ds === ds);
    });

    // Show correct controls
    ['stackControls','queueControls','linkedlistControls'].forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(`${ds}Controls`).classList.remove('hidden');

    // Labels
    const labels = { stack: 'Stack', queue: 'Queue', linkedlist: 'Linked List' };
    document.getElementById('dsTitle').textContent   = labels[ds];
    document.getElementById('vizLabel').textContent  = `${labels[ds].toUpperCase()} VISUALIZATION`;

    // Re-render current DS
    this._rerender();
    this.renderer.updateInfoPanel(ds, null);
    this.renderer.setMessage('Select an operation to begin.', 'info');
  }

  _rerender() {
    const ds = this.currentDS;
    if (ds === 'stack')      this.renderer.renderStack(this.stack);
    if (ds === 'queue')      this.renderer.renderQueue(this.queue);
    if (ds === 'linkedlist') this.renderer.renderLinkedList(this.linkedList);
  }

  /* ---- Input helpers ---- */

  _getValue(inputId) {
    const el  = document.getElementById(inputId);
    const val = el.value.trim();
    if (val === '') return null;
    const num = parseInt(val, 10);
    if (isNaN(num)) return null;
    el.value = '';
    return num;
  }

  _requireValue(inputId) {
    const v = this._getValue(inputId);
    if (v === null) {
      this.renderer.showToast('Enter a numeric value first.', 'error');
      document.getElementById(inputId).focus();
    }
    return v;
  }

  /* ---- STACK OPERATIONS ---- */

  _handlePush() {
    if (this.busy) return;
    const val = this._requireValue('stackInput');
    if (val === null) return;

    if (this.stack.size >= 12) {
      this.renderer.showToast('Stack is full (max 12 for display)', 'error');
      return;
    }

    this.stack.push(val);
    this.renderer.animatePush(this.stack);
    this.renderer.updateInfoPanel('stack', 'push');
    this.renderer.setMessage(`Pushed ${val} onto the stack. New size: ${this.stack.size}.`, 'success');
    this.renderer.showToast(`Pushed ${val}`, 'success');
  }

  _handlePop() {
    if (this.busy) return;
    if (this.stack.isEmpty) {
      this.renderer.setMessage('Stack is empty — nothing to pop!', 'error');
      this.renderer.showToast('Stack underflow!', 'error');
      return;
    }

    this.busy = true;
    const topVal = this.stack.peek();

    // Highlight the top node before popping
    this.renderer.renderStack(this.stack, true);
    this.renderer.updateInfoPanel('stack', 'pop');

    setTimeout(() => {
      this.stack.pop();
      this.renderer.renderStack(this.stack);
      this.renderer.setMessage(`Popped ${topVal} from the stack. New size: ${this.stack.size}.`, 'success');
      this.renderer.showToast(`Popped ${topVal}`, 'success');
      this.busy = false;
    }, 500);
  }

  _handlePeek() {
    if (this.stack.isEmpty) {
      this.renderer.setMessage('Stack is empty — nothing to peek!', 'error');
      this.renderer.showToast('Stack is empty', 'error');
      return;
    }
    const val = this.stack.peek();
    this.renderer.animatePeek(this.stack);
    this.renderer.updateInfoPanel('stack', 'peek');
    this.renderer.setMessage(`Top of stack is ${val}. (Size: ${this.stack.size})`, 'highlight');
    this.renderer.showToast(`Top: ${val}`, 'success');
  }

  /* ---- QUEUE OPERATIONS ---- */

  _handleEnqueue() {
    if (this.busy) return;
    const val = this._requireValue('queueInput');
    if (val === null) return;

    if (this.queue.size >= 10) {
      this.renderer.showToast('Queue is full (max 10 for display)', 'error');
      return;
    }

    this.queue.enqueue(val);
    this.renderer.animateEnqueue(this.queue);
    this.renderer.updateInfoPanel('queue', 'enqueue');
    this.renderer.setMessage(`Enqueued ${val} at the rear. Queue size: ${this.queue.size}.`, 'success');
    this.renderer.showToast(`Enqueued ${val}`, 'success');
  }

  _handleDequeue() {
    if (this.busy) return;
    if (this.queue.isEmpty) {
      this.renderer.setMessage('Queue is empty — nothing to dequeue!', 'error');
      this.renderer.showToast('Queue underflow!', 'error');
      return;
    }

    this.busy = true;
    const frontVal = this.queue.front();

    // Highlight front node
    this.renderer.animateFront(this.queue);
    this.renderer.updateInfoPanel('queue', 'dequeue');

    setTimeout(() => {
      this.queue.dequeue();
      this.renderer.renderQueue(this.queue);
      this.renderer.setMessage(`Dequeued ${frontVal} from the front. Queue size: ${this.queue.size}.`, 'success');
      this.renderer.showToast(`Dequeued ${frontVal}`, 'success');
      this.busy = false;
    }, 500);
  }

  _handleFront() {
    if (this.queue.isEmpty) {
      this.renderer.setMessage('Queue is empty!', 'error');
      this.renderer.showToast('Queue is empty', 'error');
      return;
    }
    const val = this.queue.front();
    this.renderer.animateFront(this.queue);
    this.renderer.updateInfoPanel('queue', 'front');
    this.renderer.setMessage(`Front element is ${val}. Queue size: ${this.queue.size}.`, 'highlight');
    this.renderer.showToast(`Front: ${val}`, 'success');
  }

  /* ---- LINKED LIST OPERATIONS ---- */

  _handleInsertBegin() {
    if (this.busy) return;
    const val = this._requireValue('llInput');
    if (val === null) return;

    if (this.linkedList.size >= 8) {
      this.renderer.showToast('List full (max 8 nodes for display)', 'error');
      return;
    }

    this.linkedList.insertAtBeginning(val);
    this.renderer.animateLLInsert(this.linkedList, true);
    this.renderer.updateInfoPanel('linkedlist', 'insertBegin');
    this.renderer.setMessage(`Inserted ${val} at the head. List size: ${this.linkedList.size}.`, 'success');
    this.renderer.showToast(`Inserted ${val} at head`, 'success');
  }

  _handleInsertEnd() {
    if (this.busy) return;
    const val = this._requireValue('llInput');
    if (val === null) return;

    if (this.linkedList.size >= 8) {
      this.renderer.showToast('List full (max 8 nodes for display)', 'error');
      return;
    }

    this.linkedList.insertAtEnd(val);
    this.renderer.animateLLInsert(this.linkedList, false);
    this.renderer.updateInfoPanel('linkedlist', 'insertEnd');
    this.renderer.setMessage(`Inserted ${val} at the tail. List size: ${this.linkedList.size}.`, 'success');
    this.renderer.showToast(`Inserted ${val} at tail`, 'success');
  }

  _handleDelete() {
    if (this.busy) return;
    const val = this._requireValue('llInput');
    if (val === null) return;

    if (this.linkedList.isEmpty) {
      this.renderer.setMessage('List is empty — nothing to delete!', 'error');
      this.renderer.showToast('List is empty', 'error');
      return;
    }

    const deleted = this.linkedList.delete(val);
    this.renderer.renderLinkedList(this.linkedList);
    this.renderer.updateInfoPanel('linkedlist', 'delete');

    if (deleted) {
      this.renderer.setMessage(`Deleted node with value ${val}. List size: ${this.linkedList.size}.`, 'success');
      this.renderer.showToast(`Deleted ${val}`, 'success');
    } else {
      this.renderer.setMessage(`Value ${val} not found in list.`, 'error');
      this.renderer.showToast(`${val} not found`, 'error');
    }
  }

  _handleSearch() {
    if (this.busy) return;
    const val = this._requireValue('llInput');
    if (val === null) return;

    if (this.linkedList.isEmpty) {
      this.renderer.setMessage('List is empty — nothing to search!', 'error');
      this.renderer.showToast('List is empty', 'error');
      return;
    }

    this.busy = true;
    this.renderer.updateInfoPanel('linkedlist', 'search');
    this.renderer.setMessage(`Searching for ${val}...`, 'info');

    this.renderer.animateLLSearch(this.linkedList, val, (found) => {
      this.busy = false;
    });
  }

  /* ---- Global actions ---- */

  _reset() {
    this.stack      = new Stack();
    this.queue      = new Queue();
    this.linkedList = new LinkedList();
    this.busy       = false;

    this._rerender();
    this.renderer.updateInfoPanel(this.currentDS, null);
    this.renderer.setMessage('Reset complete. Start fresh!', 'info');
    this.renderer.showToast('Reset!', 'info');
  }

  _random() {
    this._reset();
    const count  = Math.floor(Math.random() * 4) + 3; // 3–6 items
    const values = Array.from({ length: count }, () => Math.floor(Math.random() * 90) + 10);

    if (this.currentDS === 'stack') {
      values.forEach(v => this.stack.push(v));
      this.renderer.renderStack(this.stack);
    } else if (this.currentDS === 'queue') {
      values.forEach(v => this.queue.enqueue(v));
      this.renderer.renderQueue(this.queue);
    } else {
      values.forEach(v => this.linkedList.insertAtEnd(v));
      this.renderer.renderLinkedList(this.linkedList);
    }

    this.renderer.setMessage(`Generated ${count} random values.`, 'success');
    this.renderer.showToast('Random data loaded!', 'success');
  }

  _toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('themeBtn').textContent = isDark ? '☽' : '☀';
    this.renderer.showToast(isDark ? 'Light mode' : 'Dark mode', 'info');
  }
}


/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  window._app = new App();
});
