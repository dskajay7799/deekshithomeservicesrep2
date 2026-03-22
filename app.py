from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'deekshit-secret-2024-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///deekshit.db').replace('postgres://', 'postgresql://')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)


# ── MODELS ─────────────────────────────────────────────────────────────────

class User(db.Model):
    __tablename__ = 'users'
    id            = db.Column(db.Integer, primary_key=True)
    full_name     = db.Column(db.String(120), nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    phone         = db.Column(db.String(20),  nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    bookings      = db.relationship('Booking', backref='user', lazy=True)

    def set_password(self, pw):
        self.password_hash = bcrypt.generate_password_hash(pw).decode('utf-8')

    def check_password(self, pw):
        return bcrypt.check_password_hash(self.password_hash, pw)


class Booking(db.Model):
    __tablename__ = 'bookings'
    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    name           = db.Column(db.String(120), nullable=False)
    email          = db.Column(db.String(120), nullable=False)
    phone          = db.Column(db.String(20),  nullable=False)
    service_type   = db.Column(db.String(100), nullable=False)
    service_detail = db.Column(db.String(200), nullable=True)
    address        = db.Column(db.Text,         nullable=False)
    preferred_date = db.Column(db.String(50),   nullable=False)
    preferred_time = db.Column(db.String(50),   nullable=False)
    message        = db.Column(db.Text,         nullable=True)
    status         = db.Column(db.String(30),   default='Pending')
    created_at     = db.Column(db.DateTime,     default=datetime.utcnow)


class ContactMessage(db.Model):
    __tablename__ = 'contact_messages'
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(120), nullable=False)
    email      = db.Column(db.String(120), nullable=False)
    phone      = db.Column(db.String(20),  nullable=True)
    subject    = db.Column(db.String(200), nullable=False)
    message    = db.Column(db.Text,        nullable=False)
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)


# ── HELPERS ────────────────────────────────────────────────────────────────

def current_user():
    uid = session.get('user_id')
    return User.query.get(uid) if uid else None


# ── PAGE ROUTES ────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html', user=current_user())

@app.route('/services')
def services():
    return render_template('services.html', user=current_user())

@app.route('/about')
def about():
    return render_template('about.html', user=current_user())

@app.route('/contact')
def contact():
    return render_template('contact.html', user=current_user())

@app.route('/book')
def book():
    return render_template('book.html', user=current_user())

@app.route('/dashboard')
def dashboard():
    u = current_user()
    if not u:
        flash('Please log in to view your dashboard.', 'error')
        return redirect(url_for('login'))
    bookings = Booking.query.filter_by(user_id=u.id).order_by(Booking.created_at.desc()).all()
    return render_template('dashboard.html', user=u, bookings=bookings)


# ── AUTH ───────────────────────────────────────────────────────────────────

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        is_json = request.is_json
        d = request.get_json() if is_json else request.form

        full_name = d.get('full_name', '').strip()
        email     = d.get('email', '').strip().lower()
        phone     = d.get('phone', '').strip()
        password  = d.get('password', '')
        confirm   = d.get('confirm_password', '')

        errors = []
        if not full_name:              errors.append('Full name is required.')
        if '@' not in email:           errors.append('A valid email is required.')
        if not phone:                  errors.append('Phone number is required.')
        if len(password) < 6:          errors.append('Password must be at least 6 characters.')
        if password != confirm:        errors.append('Passwords do not match.')
        if User.query.filter_by(email=email).first():
            errors.append('An account with this email already exists.')

        if errors:
            if is_json:
                return jsonify({'success': False, 'errors': errors}), 400
            for e in errors:
                flash(e, 'error')
            return render_template('register.html')

        u = User(full_name=full_name, email=email, phone=phone)
        u.set_password(password)
        db.session.add(u)
        db.session.commit()
        session['user_id']   = u.id
        session['user_name'] = u.full_name

        if is_json:
            return jsonify({'success': True, 'name': u.full_name, 'redirect': '/'})
        flash(f'Welcome to Deekshit Home Services, {full_name}!', 'success')
        return redirect(url_for('index'))

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        is_json  = request.is_json
        d        = request.get_json() if is_json else request.form
        email    = d.get('email', '').strip().lower()
        password = d.get('password', '')

        u = User.query.filter_by(email=email).first()
        if u and u.check_password(password):
            session['user_id']   = u.id
            session['user_name'] = u.full_name
            if is_json:
                return jsonify({'success': True, 'name': u.full_name, 'redirect': '/'})
            flash(f'Welcome back, {u.full_name}!', 'success')
            return redirect(url_for('index'))
        else:
            if is_json:
                return jsonify({'success': False, 'errors': ['Invalid email or password.']}), 401
            flash('Invalid email or password.', 'error')

    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('index'))


# ── API ────────────────────────────────────────────────────────────────────

@app.route('/api/book', methods=['POST'])
def api_book():
    d = request.get_json()
    required = ['name', 'email', 'phone', 'service_type', 'address', 'preferred_date', 'preferred_time']
    for f in required:
        if not d.get(f):
            return jsonify({'success': False, 'message': f'Field "{f}" is required.'}), 400

    u = current_user()
    b = Booking(
        user_id        = u.id if u else None,
        name           = d['name'],
        email          = d['email'],
        phone          = d['phone'],
        service_type   = d['service_type'],
        service_detail = d.get('service_detail', ''),
        address        = d['address'],
        preferred_date = d['preferred_date'],
        preferred_time = d['preferred_time'],
        message        = d.get('message', '')
    )
    db.session.add(b)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': "Booking received! Our technician will call you within 2 hours to confirm.",
        'booking_id': b.id
    })


@app.route('/api/contact', methods=['POST'])
def api_contact():
    d = request.get_json()
    if not d.get('name') or not d.get('email') or not d.get('message'):
        return jsonify({'success': False, 'message': 'Name, email, and message are required.'}), 400

    cm = ContactMessage(
        name    = d['name'],
        email   = d['email'],
        phone   = d.get('phone', ''),
        subject = d.get('subject', 'General Inquiry'),
        message = d['message']
    )
    db.session.add(cm)
    db.session.commit()
    return jsonify({'success': True, 'message': "Message sent! We'll get back to you within 24 hours."})


@app.route('/api/my-bookings')
def api_my_bookings():
    u = current_user()
    if not u:
        return jsonify({'success': False, 'message': 'Login required.'}), 401
    result = []
    for b in Booking.query.filter_by(user_id=u.id).order_by(Booking.created_at.desc()).all():
        result.append({
            'id':             b.id,
            'service_type':   b.service_type,
            'service_detail': b.service_detail or '',
            'preferred_date': b.preferred_date,
            'preferred_time': b.preferred_time,
            'status':         b.status,
            'address':        b.address,
            'created_at':     b.created_at.strftime('%d %b %Y')
        })
    return jsonify({'success': True, 'bookings': result})


# ── INIT ───────────────────────────────────────────────────────────────────
# This runs under gunicorn too (not just __main__), so tables get created on Render

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)